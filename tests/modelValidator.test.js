class ModelValidator {
  constructor() {
    this.validator = null;
    this.validationAsync = null;
  }

  getValidator() {
    if (this.validator) {
      return this.validator;
    }

    const start = Date.now();
    const spec = import('./openapi.js').then(doc => doc.default);
    console.log(' done: ', Date.now() - start);
    const { OpenApiValidator } = require('../dist/index');
    const openApiValidator = new OpenApiValidator({ apiSpec: spec, validateRequests: { allowUnknownQueryParameters: false } });
    return (this.validator = openApiValidator.createValidator());
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

    const validator = this.getValidator();
    this.validationAsync = validator(newRequest);
    // Ensure validation may never be called, and in those cases, we want to avoid an uncaught exception
    this.validationAsync.catch(() => {});
  }

  async ensureValidation() {
    try {
      await this.validationAsync;
    } catch (error) {
      const sanitizedErrorMessage = error.message.replace('|Authress:[*]', '');
      const wrapped = Error.create({ title: `InvalidRequest: ${sanitizedErrorMessage}.` });
      wrapped.code = 'InvalidInputRequest';
      throw wrapped;
    }
  }
}


new ModelValidator().getValidator();