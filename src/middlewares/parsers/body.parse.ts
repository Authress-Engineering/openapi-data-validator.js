import { ContentType } from '../util';

import {
  OpenAPIV3,
  BodySchema
} from '../../framework/types';

export class BodySchemaParser {
  public parse(
    path: string,
    pathSchema: OpenAPIV3.OperationObject,
    contentType: ContentType
  ): BodySchema {
    // The schema.preprocessor will have dereferenced the RequestBodyObject
    // thus we can assume a RequestBodyObject, not a ReferenceObject
    const requestBody = <OpenAPIV3.RequestBodyObject>pathSchema.requestBody;
    if (Object.hasOwnProperty.call(requestBody || {}, 'content')) {
      return this.toSchema(path, contentType, requestBody);
    }
    return {};
  }

  private toSchema(
    path: string,
    contentType: ContentType,
    requestBody: OpenAPIV3.RequestBodyObject
  ): BodySchema {
    if (!requestBody?.content) {return {};}

    let content = null;
    for (const type of contentType.equivalents()) {
      content = requestBody.content[type];
      if (content) {
        return content.schema ?? {};
      }
    }

    for (const requestContentType of Object.keys(requestBody.content)
      .sort()
      .reverse()) {
      if (requestContentType === '*/*') {
        content = requestBody.content[requestContentType];
        break;
      }

      if (!new RegExp(/^[a-z]+\/\*$/).test(requestContentType)) {continue;} // not a wildcard of type application/*

      const [type] = requestContentType.split('/', 1);

      if (new RegExp(`^${type}/.+$`).test(contentType.contentType)) {
        content = requestBody.content[requestContentType];
        break;
      }
    }

    if (!content) {
      content = Object.values(requestBody.content)[0];
    }
    return content?.schema ?? {};
  }
}
