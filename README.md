## OpenAPI Model Validator
Lightweight OpenAPI complete request model validator. Fast, unopinionated, full featured validator for API requests that utilize OpenAPI docs for API documentation.

## Usage
It is simple, and that's all there is to it!

```sh
npm install openapi-model-validator --save
```

```js
const { OpenApiValidator } = require('openapi-model-validator');
const spec = require('./openapi.json');

const openApiValidator = new OpenApiValidator({ apiSpec: spec });
const validator = openApiValidator.createValidator();

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
```