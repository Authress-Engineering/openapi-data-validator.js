import ono from 'ono';
import * as _uniq from 'lodash.uniq';
import { RequestValidator } from './middlewares/openapi.request.validator';
import { Spec } from './framework/openapi.spec.loader';
import {
  OpenApiValidatorOpts,
  ValidateRequestOpts,
  OpenApiRequest,
  OpenApiRequestHandler,
  OpenAPIV3,
} from './framework/types';
import { defaultResolver } from './resolvers';
import { defaultSerDes } from './framework/base.serdes';
import { SchemaPreprocessor } from './middlewares/parsers/schema.preprocessor';
import { AjvOptions } from './framework/ajv/options';

import { OpenApiSpecLoader } from './framework/openapi.spec.loader';
export { OpenApiValidatorOpts } from './framework/types';

export class OpenApiValidator {
  readonly options: OpenApiValidatorOpts;
  readonly ajvOpts: AjvOptions;

  constructor(options: OpenApiValidatorOpts) {
    this.validateOptions(options);
    this.normalizeOptions(options);

    if (options.validateRequests == null) options.validateRequests = true;
    if (options.formats == null) options.formats = [];

    if (options.validateRequests === true) {
      options.validateRequests = {
        allowUnknownQueryParameters: false
      };
    }

    this.options = options;
    this.ajvOpts = new AjvOptions(options);
  }

  createValidator(): Function {
    const specAsync = new OpenApiSpecLoader({ apiDoc: this.options.apiSpec, validateApiSpec: this.options.validateApiSpec }).load();

    let requestValidator;
    return async (request: OpenApiRequest): Promise<void> => {
      if (!requestValidator) {
        const spec = await specAsync;
        const ajvOpts = this.ajvOpts.preprocessor;
        const sp = new SchemaPreprocessor(spec.apiDoc, ajvOpts).preProcess();
        requestValidator = new RequestValidator(spec.apiDoc, this.ajvOpts.request);
      }

      requestValidator.validate(request);
    };
  }

  private validateOptions(options: OpenApiValidatorOpts): void {
    if (!options.apiSpec) throw ono('apiSpec required');
  }

  private normalizeOptions(options: OpenApiValidatorOpts): void {
    if (!options.serDes) {
      options.serDes = defaultSerDes;
    } else {
      defaultSerDes.forEach((currentDefaultSerDes) => {
        let defaultSerDesOverride = options.serDes.find(
          (currentOptionSerDes) => {
            return currentDefaultSerDes.format === currentOptionSerDes.format;
          },
        );
        if (!defaultSerDesOverride) {
          options.serDes.push(currentDefaultSerDes);
        }
      });
    }
  }
}
