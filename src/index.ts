import ono from 'ono';
import * as _uniq from 'lodash.uniq';
import { RequestValidator } from './middlewares/openapi.request.validator';
import { OpenApiContext } from './framework/openapi.context';
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

import * as cloneDeep from 'lodash.clonedeep';
import { OpenApiSpecLoader } from './framework/openapi.spec.loader';
export { OpenApiValidatorOpts } from './framework/types';

export class OpenApiValidator {
  readonly options: OpenApiValidatorOpts;
  readonly ajvOpts: AjvOptions;

  constructor(options: OpenApiValidatorOpts) {
    this.validateOptions(options);
    this.normalizeOptions(options);

    if (options.validateRequests == null) options.validateRequests = true;
    if (options.unknownFormats == null) options.unknownFormats === true;
    if (options.validateFormats == null) options.validateFormats = 'fast';
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
    const specAsync = new OpenApiSpecLoader({ apiDoc: cloneDeep(this.options.apiSpec), validateApiSpec: this.options.validateApiSpec }).load();

    let requestValidator;
    return async (request: OpenApiRequest): Promise<void> => {
      if (!requestValidator) {
        const spec = await specAsync;
        const apiDoc = spec.apiDoc;
        const ajvOpts = this.ajvOpts.preprocessor;
        const sp = new SchemaPreprocessor(apiDoc, ajvOpts).preProcess();
        const context = new OpenApiContext(spec, this.options.ignorePaths);
        requestValidator = new RequestValidator(context.apiDoc, this.ajvOpts.request);
      }

      requestValidator.validate(request);
    };
  }

  private validateOptions(options: OpenApiValidatorOpts): void {
    if (!options.apiSpec) throw ono('apiSpec required');

    const unknownFormats = options.unknownFormats;
    if (typeof unknownFormats === 'boolean') {
      if (!unknownFormats) {
        throw ono(
          "unknownFormats must contain an array of unknownFormats, 'ignore' or true",
        );
      }
    } else if (
      typeof unknownFormats === 'string' &&
      unknownFormats !== 'ignore' &&
      !Array.isArray(unknownFormats)
    )
      throw ono(
        "unknownFormats must contain an array of unknownFormats, 'ignore' or true",
      );
  }

  private normalizeOptions(options: OpenApiValidatorOpts): void {
    if (!options.serDes) {
      options.serDes = defaultSerDes;
    } else {
      if (!Array.isArray(options.unknownFormats)) {
        options.unknownFormats = Array<string>();
      }
      options.serDes.forEach((currentSerDes) => {
        if (
          (options.unknownFormats as string[]).indexOf(currentSerDes.format) ===
          -1
        ) {
          (options.unknownFormats as string[]).push(currentSerDes.format);
        }
      });
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
