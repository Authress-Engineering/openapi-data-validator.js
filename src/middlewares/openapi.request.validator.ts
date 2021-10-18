import Ajv from 'ajv';
const { writeFile, readFile } = require('fs').promises;

import {
  ContentType,
  ajvErrorsToValidatorError,
  augmentAjvErrors
} from './util';
import {
  OpenAPIV3,
  OpenApiRequest,
  RequestValidatorOptions,
  ValidateRequestOpts,
  BadRequest,
  ParametersSchema,
  BodySchema,
  OpenApiRequestHandler
} from '../framework/types';
import { BodySchemaParser } from './parsers/body.parse';
import { ParametersSchemaParser } from './parsers/schema.parse';

type OperationObject = OpenAPIV3.OperationObject;
type SchemaObject = OpenAPIV3.SchemaObject;

function getSchemaGeneral(validationId: string, parameters: ParametersSchema, body: BodySchema): object {
  // $schema: "http://json-schema.org/draft-04/schema#",
  // eslint-disable-next-line dot-notation
  const isBodyBinary = body?.['format'] === 'binary';
  const bodyProps = !isBodyBinary && body || {};
  const bodySchema = {
    $id: validationId,
    required: ['query', 'headers', 'path'],
    properties: {
      query: {},
      headers: {},
      path: {},
      cookies: {},
      body: bodyProps,
      ...parameters
    }
  };

  const requireBody = (<SchemaObject>body).required && !isBodyBinary;
  if (requireBody) {
    (<any>bodySchema).required.push('body');
  }

  return bodySchema;
}

export class RequestValidator {
  private middlewareCache: { [key: string]: OpenApiRequestHandler } = {};
  private apiDoc: OpenAPIV3.Document;
  private requestOpts: ValidateRequestOpts = {};
  private options: RequestValidatorOptions;
  private validationModule: unknown = {};
  private ajv: Ajv;

  constructor(
    apiDoc: OpenAPIV3.Document,
    options: RequestValidatorOptions = {}
  ) {
    this.middlewareCache = {};
    this.apiDoc = apiDoc;
    this.requestOpts.allowUnknownQueryParameters = options.allowUnknownQueryParameters;
    this.options = options;
  }

  public validate(req: OpenApiRequest): void {
    const route = req.route;
    // cache middleware by combining method, path, and contentType
    const contentType = ContentType.from(req);
    const contentTypeKey = contentType.equivalents()[0] ?? 'not_provided';
    const key = `${req.method}-${route}-${contentTypeKey}`.toLocaleLowerCase();

    if (!this.middlewareCache[key]) {
      if (this.validationModule[key]) {
        this.middlewareCache[key] = this.buildMiddlewareFromModule(key);
      } else {
        this.middlewareCache[key] = this.buildMiddleware(key, route, req.method, contentType);
      }
    }
    
    this.middlewareCache[key](req);
  }

  public async compile(filepath: string): Promise<void> {
    const { createRequestAjv } = require('../framework/ajv');
    const ajvCompiled = createRequestAjv(this.apiDoc, Object.assign({ code: { source: true } }, this.options));
    const keyMap = {};
    for (const path of Object.keys(this.apiDoc.paths)) {
      for (const method of Object.keys(this.apiDoc.paths[path])) {
        const reqSchema = this.apiDoc.paths[path][method];
        const schemaParser = new ParametersSchemaParser(ajvCompiled, this.apiDoc);
        const parameters = schemaParser.parse(path, reqSchema.parameters);

        // Include no body with `null`
        let defaultKey;
        for (const contentTypeRaw of Object.keys(reqSchema.requestBody?.content || {}).concat(null)) {
          const contentTypeData = ContentType.fromString(contentTypeRaw);
          const contentTypeKey = (contentTypeRaw && contentTypeData.equivalents()[0]) ?? 'not_provided';
          const key = `${method}-${path}-${contentTypeKey}`.toLocaleLowerCase();
          if (!contentTypeRaw && defaultKey) {
            keyMap[key] = defaultKey;
            continue;
          }
          keyMap[key] = defaultKey = key;
          const body = contentTypeRaw && new BodySchemaParser().parse(path, reqSchema, contentTypeData);

          // eslint-disable-next-line dot-notation
          const isBodyBinary = body?.['format'] === 'binary';
          const bodyProps = !isBodyBinary && body || {};
          const bodySchema = {
            $id: key,
            required: ['query', 'headers', 'path'],
            properties: {
              query: {
                additionalProperties: !!this.requestOpts.allowUnknownQueryParameters
              },
              headers: {},
              path: {},
              cookies: {},
              body: bodyProps,
              ...parameters
            }
          };

          const requireBody = (<SchemaObject>body)?.required && !isBodyBinary;
          if (requireBody) {
            (<any>bodySchema).required.push('body');
          }
          ajvCompiled.addSchema(bodySchema);
        }
      }
    }

    const standaloneCode = require('ajv/dist/standalone').default;
    const moduleCode = standaloneCode(ajvCompiled, keyMap);
    if (filepath) {
      await writeFile(filepath, moduleCode);
    }
  }

  public async loadCompiled(filepath: string): Promise<void> {
    const moduleCode = await readFile(filepath);
    this.validationModule = require('require-from-string')(moduleCode.toString());
  }

  private buildMiddlewareFromModule(validationId: string): OpenApiRequestHandler {
    return (req: OpenApiRequest): void => {
      const cookies = req.cookies
        ? {
          ...req.cookies,
          ...req.signedCookies
        }
        : undefined;

      const data = {
        query: req.query ?? {},
        headers: req.headers || {},
        path: req.path || {},
        cookies,
        body: req.body
      };

      const validator = this.validationModule[validationId];
      const valid = validator(data);

      if (valid) {
        return;
      }
      const errors = augmentAjvErrors([].concat(validator.errors ?? []));
      const err = ajvErrorsToValidatorError(400, errors);
      let message = 'No errors';
      if (errors && errors.length) {
        message = errors.map(e => `request${e.instancePath} ${e.message}`).join(', ');
      }
      const error: BadRequest = new BadRequest({
        path: req.route,
        message: message
      });
      error.errors = err.errors;
      throw error;
    };
  }

  private buildMiddleware(
    validationId: string,
    path: string,
    method: string,
    contentType: ContentType
  ): OpenApiRequestHandler {
    const reqSchema = this.apiDoc && this.apiDoc.paths[path] && this.apiDoc.paths[path][method.toLowerCase()];
    if (!reqSchema) {
      return (): void => {};
    }

    if (!this.ajv) {
      const { createRequestAjv } = require('../framework/ajv');
      this.ajv = createRequestAjv(this.apiDoc, this.options);
    }

    const schemaParser = new ParametersSchemaParser(this.ajv, this.apiDoc);
    const parameters = schemaParser.parse(path, reqSchema.parameters);
    const body = new BodySchemaParser().parse(path, reqSchema, contentType);
    const schemaGeneral = getSchemaGeneral(validationId, parameters, body);
    const validator = this.ajv.compile(schemaGeneral);

    return (req: OpenApiRequest): void => {
      const cookies = req.cookies
        ? {
          ...req.cookies,
          ...req.signedCookies
        }
        : undefined;

      const data = {
        query: req.query ?? {},
        headers: req.headers || {},
        path: req.path || {},
        cookies,
        body: req.body
      };

      const valid = validator(data);
      if (valid) {
        return;
      }
      const errors = augmentAjvErrors([].concat(validator.errors ?? []));
      const err = ajvErrorsToValidatorError(400, errors);
      const message = this.ajv.errorsText(errors, { dataVar: 'request' });
      const error: BadRequest = new BadRequest({
        path: req.route,
        message: message
      });
      error.errors = err.errors;
      throw error;
    };
  }
}
