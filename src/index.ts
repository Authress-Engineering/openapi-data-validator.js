import { RequestValidator } from './middlewares/openapi.request.validator';
import {
  OpenApiValidatorOpts,
  OpenApiRequest,
  OpenAPIV3
} from './framework/types';
import { defaultSerDes } from './framework/base.serdes';
import { AjvOptions } from './framework/ajvOptions';
export { OpenApiValidatorOpts } from './framework/types';

export class OpenApiValidator {
  readonly options: OpenApiValidatorOpts;
  readonly ajvOpts: AjvOptions;

  constructor(options: OpenApiValidatorOpts) {
    this.validateOptions(options);
    this.normalizeOptions(options);

    if (!options.validateRequests && options.validateRequests !== false) {
      options.validateRequests = true;
    }

    if (options.validateRequests === true) {
      options.validateRequests = {
        allowUnknownQueryParameters: false
      };
    }

    this.options = options;
    this.ajvOpts = new AjvOptions(options);
  }

  createValidator(): (request: OpenApiRequest) => Promise<void> {
    const specAsync = this.loadSpec(this.options.apiSpec);

    let requestValidator;
    return async (request: OpenApiRequest): Promise<void> => {
      if (!requestValidator) {
        const spec = await specAsync;
        const ajvOpts = this.ajvOpts.preprocessor;
        const { SchemaPreprocessor } = require('./middlewares/parsers/schema.preprocessor');
        new SchemaPreprocessor(spec, ajvOpts).preProcess();
        requestValidator = new RequestValidator(spec, this.ajvOpts.request);
      }

      requestValidator.validate(request);
    };
  }

  public async compileValidator(): Promise<void> {
    const specAsync = this.loadSpec(this.options.apiSpec);
    const spec = await specAsync;
    const ajvOpts = this.ajvOpts.preprocessor;
    const { SchemaPreprocessor } = require('./middlewares/parsers/schema.preprocessor');
    new SchemaPreprocessor(spec, ajvOpts).preProcess();
    const requestValidator = new RequestValidator(spec, this.ajvOpts.request);
    await requestValidator.compile(this.options.compiledFilePath);
  }

  private async loadSpec(schemaOrPath: Promise<object> | string | object): Promise<OpenAPIV3.Document> {
    if (typeof schemaOrPath === 'string') {
      const origCwd = process.cwd();
      const path = require('path');
      const absolutePath = path.resolve(origCwd, schemaOrPath);
      const { access } = require('fs').promises;
      await access(absolutePath);
      const $RefParser = require('@apidevtools/json-schema-ref-parser');
      return Object.assign($RefParser.dereference(absolutePath));
    }

    // Test the full parser
    // const $RefParser = require('@apidevtools/json-schema-ref-parser');
    // const result = await $RefParser.dereference(await schemaOrPath);
    const cloneDeep = require('lodash.clonedeep');
    const dereference = require('@apidevtools/json-schema-ref-parser/lib/dereference');
    const $Refs = require('@apidevtools/json-schema-ref-parser/lib/refs');
    
    const handler = { schema: null, $refs: new $Refs() };
    // eslint-disable-next-line no-underscore-dangle
    const $ref = handler.$refs._add('');
    $ref.value = cloneDeep(await schemaOrPath);
    $ref.pathType = 'http';
    handler.schema = $ref.value;
    dereference(handler, { parse: {}, dereference: { excludedPathMatcher: () => false } });
    return Object.assign(handler.schema);
  }

  public async loadValidator(): Promise<(request: OpenApiRequest) => Promise<void>> {
    const requestValidator = new RequestValidator(null, this.ajvOpts.request);
    await requestValidator.loadCompiled(this.options.compiledFilePath);
    return async (request: OpenApiRequest): Promise<void> => {
      await requestValidator.validate(request);
    };
  }

  private validateOptions(options: OpenApiValidatorOpts): void {
    if (!options.apiSpec && !options.compiledFilePath) {
      throw Error('apiSpec required');
    }
  }

  private normalizeOptions(options: OpenApiValidatorOpts): void {
    if (!options.serDes) {
      options.serDes = defaultSerDes;
    } else {
      defaultSerDes.forEach(currentDefaultSerDes => {
        const defaultSerDesOverride = options.serDes.find(
          currentOptionSerDes => {
            return currentDefaultSerDes.format === currentOptionSerDes.format;
          }
        );
        if (!defaultSerDesOverride) {
          options.serDes.push(currentDefaultSerDes);
        }
      });
    }
  }
}
