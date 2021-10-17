import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { formats } from './formats';
import { OpenAPIV3, Options } from '../types';

export function createRequestAjv(
  openApiSpec: OpenAPIV3.Document,
  options: Options = {}
): Ajv {
  const ajv = new Ajv({
    strictTypes: false,
    discriminator: true,
    allErrors: true,
    jsPropertySyntax: true,
    coerceTypes: 'array',
    ...options,
    logger: {
      log(...args) { console.log(...args); },
      warn(...args) {
        if (!arguments[0]?.match('jsPropertySyntax')) {
          console.warn(...args);
        }
      },
      error(...args) { console.error(...args); }
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

  if (openApiSpec.components?.schemas) {
    Object.entries(openApiSpec.components.schemas).forEach(([id]) => {
      ajv.addSchema(
        openApiSpec.components.schemas[id],
        `#/components/schemas/${id}`
      );
    });
  }

  return ajv;
}
