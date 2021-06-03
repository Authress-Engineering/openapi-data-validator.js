##

## Usage

```js
const { OpenApiValidator } = require('express-openapi-validator');
const spec = require('./openapi.json');

const openApiValidator = new OpenApiValidator({ apiSpec: spec });
const validator = openApiValidator.createValidator();

class ModelValidator {
  constructor() {
    this.legacySchema = null;
  }
  async validate(request) {
    const newRequest = {
      method: request.httpMethod,
      headers: request.headers,
      query: request.queryStringParameters,
      body: request.body,
      params: request.pathParameters,

      // Matched openapi specification generic route
      route: request.route
    };
    await validator(newRequest);
  }
  ```