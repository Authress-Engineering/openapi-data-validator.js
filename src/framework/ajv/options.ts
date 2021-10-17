import { Options as AjvSdkOptions } from 'ajv';
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
  get preprocessor(): AjvSdkOptions {
    return this.baseOptions();
  }

  get request(): RequestValidatorOptions {
    const { allowUnknownQueryParameters, removeAdditional } = <
      ValidateRequestOpts
    > this.options.validateRequests;
    return {
      ...this.baseOptions(),
      allowUnknownQueryParameters,
      removeAdditional
    };
  }

  private baseOptions(): Options {
    const {
      serDes
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
      useDefaults: true,
      removeAdditional: false,
      validateFormats: false,
      formats: this.options.formats.reduce((acc, f) => {
        acc[f.name] = {
          type: f.type,
          validate: f.validate
        };
        return acc;
      }, {}),
      serDesMap: serDesMap
    };
  }
}
