import Ajv, { ValidateFunction, ErrorObject, Options } from 'ajv';
import addFormats from 'ajv-formats';
// import * as draftSchema from 'ajv/lib/refs/json-schema-draft-07.json';
// https://github.com/OAI/OpenAPI-Specification/blob/master/schemas/v3.0/schema.json
import * as openapi3Schema from './openapi.v3.schema.json';
import { OpenAPIV3 } from './types';

export interface OpenAPISchemaValidatorOpts {
  version: string;
  validateApiSpec: boolean;
  extensions?: object;
}
export class OpenAPISchemaValidator {
  private validator: ValidateFunction;
  constructor(opts: OpenAPISchemaValidatorOpts) {
    const options: Options = {
      allErrors: true,
      strictTypes: false
    };

    if (!opts.validateApiSpec) {
      options.validateSchema = false;
    }

    const ajv = new Ajv(options);
    addFormats(ajv);
    // v.addMetaSchema(draftSchema);

    const ver = opts.version && parseInt(String(opts.version), 10);
    if (!ver) {throw Error('version missing from OpenAPI specification');}
    if (ver !== 3) {throw Error('OpenAPI v3 specification version is required');}

    ajv.addSchema(openapi3Schema);
    this.validator = ajv.compile(openapi3Schema);
  }

  public validate(
    openapiDoc: OpenAPIV3.Document
  ): { errors: Array<ErrorObject> | null } {
    const valid = this.validator(openapiDoc);
    if (!valid) {
      return { errors: this.validator.errors };
    }
    return { errors: [] };
  }
}
