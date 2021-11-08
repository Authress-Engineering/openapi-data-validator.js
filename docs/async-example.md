## Async Example
This includes three parts:
* the caller, which is a middleware for the [OpenAPI Factory library](https://www.npmjs.com/package/openapi-factory)
* an async wrapper, which is a custom class to contain helpers for validation.
* a pre-step is to call `compileValidator` during the build step and save the `compiledSpecValidation.json`, so that it will run faster on production execution.

```js
// OpenAPI Factory wrapper
let api = new Api({
  async requestMiddleware(request, context) {
    modelValidator.startValidation(request);
    if (request.httpMethod !== 'GET') {
      await modelValidator.ensureValidation();
    }
    return request;
  },
  async responseMiddleware(request, response) {
    try {
      await modelValidator.ensureValidation();
    } catch (error) {
      throw error;
    }
    return response;
  },
  errorMiddleware(request, error) {
    if (error.code === 'InvalidInputRequest') {
      return { statusCode: 400, body: { errorCode: 'InvalidRequest', errorId: request.requestContext.requestId, title: error.message.title } }
    }

    return { statusCode: 500, body: { title: 'Unexpected error', errorId: request.requestContext.requestId } };
  }
});
```

```js
class ModelValidator {
  constructor() {
    this.validator = null;
    this.validationAsync = null;
  }

  getOpenApiValidationProvider(spec) {
    const path = require('path');
    const { OpenApiValidator } = require('openapi-data-validator');
    const compiledFilePath = path.join(__dirname, 'compiledSpecValidation.json');
    return new OpenApiValidator({ apiSpec: spec, compiledFilePath: compiledFilePath, validateRequests: { allowUnknownQueryParameters: false } });
  }

  async compileValidator() {
    const spec = import('./openapi.js').then(doc => doc.default);
    const openApiValidator = this.getOpenApiValidationProvider(spec);
    await openApiValidator.compileValidator();
  }

  getValidator() {
    if (this.validator) {
      return this.validator;
    }

    const openApiValidator = this.getOpenApiValidationProvider();
    return this.validator = openApiValidator.loadValidator();
  }

  startValidation(request) {
    const newRequest = {
      method: request.httpMethod,
      headers: request.headers,
      query: request.queryStringParameters,
      body: request.body,
      path: request.pathParameters,
      route: request.route
    };

    this.validationAsync = this.getValidator().then(validator => validator(newRequest));
    // Ensure validation may never be called, and in those cases, we want to avoid an uncaught exception
    this.validationAsync.catch(() => {});
  }

  async ensureValidation() {
    try {
      await this.validationAsync;
    } catch (error) {
      const wrapped = Error.create({ title: `InvalidRequest: ${error.message}.` });
      wrapped.code = 'InvalidInputRequest';
      throw wrapped;
    }
  }
}

module.exports = new ModelValidator();
```