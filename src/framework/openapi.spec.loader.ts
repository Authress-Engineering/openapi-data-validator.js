import { OpenAPIFramework } from './index';
import {
  OpenAPIV3,
  OpenAPIFrameworkArgs
} from './types';

export class OpenApiSpecLoader {
  private readonly framework: OpenAPIFramework;
  constructor(opts: OpenAPIFrameworkArgs) {
    this.framework = new OpenAPIFramework(opts);
  }

  public async load(): Promise<OpenAPIV3.Document> {
    const apiDoc = await this.framework.initialize();
    return apiDoc;
  }
}
