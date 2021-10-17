class ModelValidator {
  constructor() {
    this.validator = null;
  }

  getValidator() {
    if (this.validator) {
      return this.validator;
    }

    const spec = import('./openapi.js').then(doc => doc.default);
    const { OpenApiValidator } = require('../dist/index');
    const openApiValidator = new OpenApiValidator({ apiSpec: spec, validateRequests: { allowUnknownQueryParameters: false } });
    this.validator = openApiValidator.createValidator();
    return this.validator;
  }
}

new ModelValidator().getValidator();

// eslint-disable-next-line no-unused-vars
async function testValidation() {
  const request = {
    method: 'GET',
    headers: {},
    query: {},
    body: {},
    path: { userId: 'userId', resourceUri: '*' },
    route: '/v1/users/{userId}/resources/{resourceUri}/permissions'
  };
  
  const resultAsync = new ModelValidator().getValidator()(request);
  // await new Promise(resolve => setTimeout(resolve, 1));
  const startValidation = Date.now();
  const result = await resultAsync;
  console.log('*** Validation Done', Date.now() - startValidation, result);
}

// testValidation();
