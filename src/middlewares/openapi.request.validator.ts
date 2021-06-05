import Ajv, { ValidateFunction } from 'ajv';
import { createRequestAjv } from '../framework/ajv';
import {
  ContentType,
  ajvErrorsToValidatorError,
  augmentAjvErrors,
} from './util';
import {
  OpenAPIV3,
  OpenApiRequest,
  RequestValidatorOptions,
  ValidateRequestOpts,
  BadRequest,
  ParametersSchema,
  BodySchema,
  ValidationSchema,
  OpenApiRequestHandler,
} from '../framework/types';
import { BodySchemaParser } from './parsers/body.parse';
import { ParametersSchemaParser } from './parsers/schema.parse';
import { RequestParameterMutator } from './parsers/req.parameter.mutator';

type OperationObject = OpenAPIV3.OperationObject;
type SchemaObject = OpenAPIV3.SchemaObject;
type ReferenceObject = OpenAPIV3.ReferenceObject;
type SecuritySchemeObject = OpenAPIV3.SecuritySchemeObject;
type ApiKeySecurityScheme = OpenAPIV3.ApiKeySecurityScheme;

export class RequestValidator {
  private middlewareCache: { [key: string]: OpenApiRequestHandler } = {};
  private apiDoc: OpenAPIV3.Document;
  private ajv: Ajv;
  private ajvBody: Ajv;
  private requestOpts: ValidateRequestOpts = {};

  constructor(
    apiDoc: OpenAPIV3.Document,
    options: RequestValidatorOptions = {},
  ) {
    this.middlewareCache = {};
    this.apiDoc = apiDoc;
    this.requestOpts.allowUnknownQueryParameters =
      options.allowUnknownQueryParameters;
    this.ajv = createRequestAjv(apiDoc, options);
    this.ajvBody = createRequestAjv(apiDoc, options);
  }

  public validate(req: OpenApiRequest): void {
    const route = req.route;
    const reqSchema = this.apiDoc.paths[route] && this.apiDoc.paths[route][req.method.toLowerCase()];
    if (!reqSchema) {
      return;
    }
    // cache middleware by combining method, path, and contentType
    const contentType = ContentType.from(req);
    const contentTypeKey = contentType.equivalents()[0] ?? 'not_provided';
    // use openapi.expressRoute as path portion of key
    const key = `${req.method}-${route}-${contentTypeKey}`;

    if (!this.middlewareCache[key]) {
      const middleware = this.buildMiddleware(route, reqSchema, contentType);
      this.middlewareCache[key] = middleware;
    }
    
    this.middlewareCache[key](req);
  }

  private buildMiddleware(
    path: string,
    reqSchema: OperationObject,
    contentType: ContentType,
  ): OpenApiRequestHandler {
    const apiDoc = this.apiDoc;
    const schemaParser = new ParametersSchemaParser(this.ajv, apiDoc);
    const parameters = schemaParser.parse(path, reqSchema.parameters);
    const body = new BodySchemaParser().parse(path, reqSchema, contentType);
    const validator = new Validator(this.apiDoc, parameters, body, {
      general: this.ajv,
      body: this.ajvBody,
    });

    const allowUnknownQueryParameters = !!(
      reqSchema['x-allow-unknown-query-parameters'] ??
      this.requestOpts.allowUnknownQueryParameters
    );

    return (req: OpenApiRequest): void => {
      const schemaProperties = validator.allSchemaProperties;
      const mutator = new RequestParameterMutator(
        this.ajv,
        apiDoc,
        path,
        schemaProperties,
      );

      mutator.modifyRequest(req, reqSchema);

      if (!allowUnknownQueryParameters) {
        this.processQueryParam(req.query, schemaProperties.query);
      }

      const cookies = req.cookies
        ? {
            ...req.cookies,
            ...req.signedCookies,
          }
        : undefined;

      const data = {
        query: req.query ?? {},
        headers: req.headers || {},
        path: req.path || {},
        cookies,
        body: req.body,
      };
      const validatorBody = validator.validatorBody;
      const valid = validator.validatorGeneral(data);
      const validBody = validatorBody(data);

      if (valid && validBody) {
        return;
      }
      const errors = augmentAjvErrors(
        []
          .concat(validator.validatorGeneral.errors ?? [])
          .concat(validatorBody.errors ?? []),
      );
      const err = ajvErrorsToValidatorError(400, errors);
      const message = this.ajv.errorsText(errors, { dataVar: 'request' });
      const error: BadRequest = new BadRequest({
        path: req.route,
        message: message,
      });
      error.errors = err.errors;
      throw error;
    }
  }

  private processQueryParam(query: object, schema) {
    const entries = Object.entries(schema.properties ?? {});
    let keys = [];
    for (const [key, prop] of entries) {
      if (prop['type'] === 'object' && prop['additionalProperties']) {
        // we have an object that allows additional properties
        return;
      }
      keys.push(key);
    }
    const knownQueryParams = new Set(keys);
    const queryParams = Object.keys(query);
    const allowedEmpty = schema.allowEmptyValue;
    for (const q of queryParams) {
      if (!knownQueryParams.has(q)) {
        throw new BadRequest({
          path: `.query.${q}`,
          message: `Unknown query parameter '${q}'`,
        });
      } else if (!allowedEmpty?.has(q) && (query[q] === '' || null)) {
        throw new BadRequest({
          path: `.query.${q}`,
          message: `Empty value found for query parameter '${q}'`,
        });
      }
    }
  }
}

class Validator {
  private readonly apiDoc: OpenAPIV3.Document;
  readonly schemaGeneral: object;
  readonly schemaBody: object;
  readonly validatorGeneral: ValidateFunction;
  readonly validatorBody: ValidateFunction;
  readonly allSchemaProperties: ValidationSchema;

  constructor(
    apiDoc: OpenAPIV3.Document,
    parametersSchema: ParametersSchema,
    bodySchema: BodySchema,
    ajv: {
      general: Ajv;
      body: Ajv;
    },
  ) {
    this.apiDoc = apiDoc;
    this.schemaGeneral = this._schemaGeneral(parametersSchema);
    this.schemaBody = this._schemaBody(bodySchema);
    this.allSchemaProperties = {
      ...(<any>this.schemaGeneral).properties, // query, header, params props
      body: (<any>this.schemaBody).properties.body, // body props
    };
    this.validatorGeneral = ajv.general.compile(this.schemaGeneral);
    this.validatorBody = ajv.body.compile(this.schemaBody);
  }

  private _schemaGeneral(parameters: ParametersSchema): object {
    // $schema: "http://json-schema.org/draft-04/schema#",
    return {
      paths: this.apiDoc.paths,
      components: this.apiDoc.components,
      required: ['query', 'headers', 'path'],
      properties: { ...parameters, body: {} },
    };
  }

  private _schemaBody(body: BodySchema): object {
    // $schema: "http://json-schema.org/draft-04/schema#"
    const isBodyBinary = body?.['format'] === 'binary';
    const bodyProps = isBodyBinary ? {} : body;
    const bodySchema = {
      paths: this.apiDoc.paths,
      components: this.apiDoc.components,
      properties: {
        query: {},
        headers: {},
        path: {},
        cookies: {},
        body: bodyProps,
      },
    };
    const requireBody = (<SchemaObject>body).required && !isBodyBinary;
    if (requireBody) {
      (<any>bodySchema).required = ['body'];
    }
    return bodySchema;
  }
}
