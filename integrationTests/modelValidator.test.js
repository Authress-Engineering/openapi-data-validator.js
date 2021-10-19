class ModelValidator {
  async getValidator() {
    const spec = import('../tests/openapi.js').then(doc => doc.default);
    const { OpenApiValidator } = require('../dist/index');
    const openApiValidator = new OpenApiValidator({ apiSpec: spec, compiledFilePath: './compiledValidator.json', validateRequests: { allowUnknownQueryParameters: false } });
    // return openApiValidator.createValidator();
    await openApiValidator.compileValidator();
    const start = Date.now();
    const validator = await openApiValidator.loadValidator();
    console.log('*** Validator loaded', Date.now() - start);
    return validator;
  }
}

// eslint-disable-next-line no-unused-vars
async function testValidation() {
  const request = {
    method: 'POST',
    query: {
      badParameter: 'BadValue'
    },
    headers: { 'Authorization': 'Bearer AUTH', 'Host': 'test13.api.authress.io', 'User-Agent': 'Amazon CloudFront' },
    route: '/v1/invites',
    body: {
      email: 'testemail@test.email',
      statements: [{ badParameter: ['Authress:Owner'], resources: [{ resourceUri: 'Authress:*' }] }]
    }
  };
  
  const validatorAsync = new ModelValidator().getValidator();
  const validator = await validatorAsync;
  const startValidation = Date.now();
  const resultAsync = validator(request);
  try {
    const result = await resultAsync;
    console.log('*** Validation Done', Date.now() - startValidation, result);
  } catch (error) {
    console.log('*** Validation Done with Error', Date.now() - startValidation, error);
  }
}

testValidation();
