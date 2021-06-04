import Ajv, { ValidateFunction, AnySchemaObject, SchemaObjCxt } from 'ajv';
import addFormats from 'ajv-formats';
import { formats } from './formats';
import { OpenAPIV3, Options } from '../types';

export function createRequestAjv(
  openApiSpec: OpenAPIV3.Document,
  options: Options = {},
): Ajv {
  return createAjv(openApiSpec, options);
}

export function createResponseAjv(
  openApiSpec: OpenAPIV3.Document,
  options: Options = {},
): Ajv {
  return createAjv(openApiSpec, options, false);
}

function createAjv(
  openApiSpec: OpenAPIV3.Document,
  options: Options = {},
  request = true,
): Ajv {
  const ajv = new Ajv({
    strictTypes: false,
    discriminator: true,
    allErrors: true,
    jsPropertySyntax: true,
    ...options,
    logger: {
      log(...args) { console.log(...args) },
      warn (...args) {
        if (!arguments[0]?.match('jsPropertySyntax')) {
          console.warn(...args);
        }
      },
      error(...args) { console.error(...args) }
    }
  });
  addFormats(ajv);
  Object.keys({ ...formats, ...options.formats }).forEach(formatKey => {
    ajv.addFormat(formatKey, formats[formatKey]);
  });
  ajv.removeKeyword('propertyNames');
  ajv.removeKeyword('contains');
  ajv.removeKeyword('const');

  ajv.addKeyword({ keyword: 'paths' });
  ajv.addKeyword({ keyword: 'components' });
  ajv.addKeyword({ keyword: 'example' });

  // if (options.serDesMap) {
  //   ajv.addKeyword({
  //     keyword: 'x-eov-serdes',
  //     modifying: true,
  //     compile: (sch) => {
  //       if (sch) {
  //         return function validate(data, path, obj, propName) {
  //           if (typeof data === 'object') return true;
  //           if(!!sch.deserialize) {
  //             obj[propName] = sch.deserialize(data);
  //           }
  //           return true;
  //         };
  //       }
  //       return () => true;
  //     },
  //   });
  // }
  // ajv.removeKeyword('readOnly');
  // ajv.addKeyword({
  //   keyword: 'readOnly',
  //   modifying: true,
  //   compile: (sch) => {
  //     if (sch) {
  //       return function validate(schema: any, parentSchema: AnySchemaObject, it: SchemaObjCxt) {
  //         const isValid = !(sch === true && it.data != null);
  //         delete schema[it.propertyName.str];
  //         (<ValidateFunction>validate).errors = [
  //           {
  //             keyword: 'readOnly',
  //             schemaPath: it.schemaPath.str,
  //             instancePath: it.schemaPath.str,
  //             message: `is read-only`,
  //             params: { readOnly: it.propertyName.str },
  //           },
  //         ];
  //         return isValid;
  //       };
  //     }

  //     return () => true;
  //   },
  // });

  if (openApiSpec.components?.schemas) {
    Object.entries(openApiSpec.components.schemas).forEach(([id, schema]) => {
      ajv.addSchema(
        openApiSpec.components.schemas[id],
        `#/components/schemas/${id}`,
      );
    });
  }

  return ajv;
}
