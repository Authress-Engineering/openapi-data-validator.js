import * as fs from 'fs';
import * as path from 'path';
import * as $RefParser from '@apidevtools/json-schema-ref-parser';
import { BasePath } from './base.path';
import {
  OpenAPIFrameworkArgs,
  OpenAPIV3,
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
          JSON.stringify(apiDocValidation.errors, null, '  '),
        );
        throw new Error(
          `${this.loggingPrefix}args.apiDoc was invalid.  See the output.`,
        );
      }
    }

    return apiDoc;
  }

  private async loadSpec(
    filePath: Promise<object> | string | object,
  ): Promise<OpenAPIV3.Document> {
    if (typeof filePath === 'string') {
      const origCwd = process.cwd();
      const absolutePath = path.resolve(origCwd, filePath);
      if (fs.existsSync(absolutePath)) {
        // Get document, or throw exception on error
        return Object.assign($RefParser.dereference(absolutePath));
      } else {
        throw new Error(
          `${this.loggingPrefix}spec could not be read at ${filePath}`,
        );
      }
    }
    return Object.assign($RefParser.dereference(cloneDeep(await filePath)));
  }
}
