import * as path from 'path';
import * as dereference from '@apidevtools/json-schema-ref-parser/lib/dereference';
import * as $Refs from '@apidevtools/json-schema-ref-parser/lib/refs';
import {
  OpenAPIFrameworkArgs,
  OpenAPIV3
} from './types';
import * as cloneDeep from 'lodash.clonedeep';

export class OpenAPIFramework {
  private readonly args: OpenAPIFrameworkArgs;
  private readonly loggingPrefix: string = 'openapi.validator: ';

  constructor(args: OpenAPIFrameworkArgs) {
    this.args = args;
  }

  public async initialize(): Promise<OpenAPIV3.Document> {
    const args = this.args;
    const apiDoc = await this.loadSpec(args.apiDoc);

    // args.validateApiSpec = true;
    if (args.validateApiSpec) {
      const { OpenAPISchemaValidator } = require('./openapi.schema.validator');
      const validator = new OpenAPISchemaValidator({
        version: apiDoc.openapi,
        validateApiSpec: args.validateApiSpec
      });
      const apiDocValidation = validator.validate(apiDoc);

      if (apiDocValidation.errors.length) {
        console.error(`${this.loggingPrefix}Validating schema`);
        console.error(
          `${this.loggingPrefix}validation errors`,
          JSON.stringify(apiDocValidation.errors, null, '  ')
        );
        throw new Error(
          `${this.loggingPrefix}args.apiDoc was invalid.  See the output.`
        );
      }
    }

    return apiDoc;
  }

  private async loadSpec(
    schemaOrPath: Promise<object> | string | object
  ): Promise<OpenAPIV3.Document> {
    if (typeof schemaOrPath === 'string') {
      const origCwd = process.cwd();
      const absolutePath = path.resolve(origCwd, schemaOrPath);
      const { access } = require('fs').promises;
      await access(absolutePath);
      const $RefParser = require('@apidevtools/json-schema-ref-parser');
      return Object.assign($RefParser.dereference(absolutePath));
    }

    // Test the full parser
    // const $RefParser = require('@apidevtools/json-schema-ref-parser');
    // const result = await $RefParser.dereference(await schemaOrPath);
    
    const handler = { schema: null, $refs: new $Refs() };
    // eslint-disable-next-line no-underscore-dangle
    const $ref = handler.$refs._add('');
    $ref.value = cloneDeep(await schemaOrPath);
    $ref.pathType = 'http';
    handler.schema = $ref.value;
    dereference(handler, { parse: {}, dereference: {} });
    return Object.assign(handler.schema);
  }
}
