import ajv = require('ajv');
import {
  OpenApiValidatorOpts,
  Options,
  RequestValidatorOptions,
  ValidateRequestOpts
} from '../types';

export class AjvOptions {
  private options: OpenApiValidatorOpts;
  constructor(options: OpenApiValidatorOpts) {
    this.options = options;
  }
  get preprocessor(): ajv.Options {
    return this.baseOptions();
  }

  get request(): RequestValidatorOptions {
    const { allowUnknownQueryParameters, removeAdditional } = <
      ValidateRequestOpts
    >this.options.validateRequests;
    return {
      ...this.baseOptions(),
      allowUnknownQueryParameters,
      removeAdditional,
    };
  }

  private baseOptions(): Options {
    const {
      unknownFormats,
      validateFormats,
      serDes,
    } = this.options;
    const serDesMap = {};
    for (const serDesObject of serDes) {
      if (!serDesMap[serDesObject.format]) {
        serDesMap[serDesObject.format] = serDesObject;
      } else {
        if (serDesObject.serialize) {
          serDesMap[serDesObject.format].serialize = serDesObject.serialize;
        }
        if (serDesObject.deserialize) {
          serDesMap[serDesObject.format].deserialize = serDesObject.deserialize;
        }
      }
    }

    return {
      validateSchema: false,
      nullable: true,
      useDefaults: true,
      removeAdditional: false,
      unknownFormats,
      format: validateFormats,
      formats: this.options.formats.reduce((acc, f) => {
        acc[f.name] = {
          type: f.type,
          validate: f.validate,
        };
        return acc;
      }, {}),
      serDesMap: serDesMap,
    };
  }
}
