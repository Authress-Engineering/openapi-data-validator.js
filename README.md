## OpenAPI Data Validator
Lightweight OpenAPI complete request model validator. Fast, unopinionated, full featured validator for API requests that utilize OpenAPI docs for API documentation.

## Usage
It is simple, and that's all there is to it!

```sh
npm install openapi-data-validator --save
```

```js
const { OpenApiValidator } = require('openapi-data-validator');
const spec = require('./openapi.json');

const openApiValidator = new OpenApiValidator({ apiSpec: spec });
const validator = openApiValidator.createValidator();

const newRequest = {
  method: 'GET',
  headers: { Authorization: 'Bearer Token' },
  query: { limit: 10 },
  body: { field: true },
  path: { user: 'userId' },

  // Matched openapi specification generic route
  route: request.route
};
await validator(newRequest);
```

## FAQs

#### Why not just use AJV
AJV is the best, but there are some things that just are very OpenAPI specific that don't make sense to be in the validator. Don't need them? Great, go use AJV.

* Top level defined Path parameters - AJV doesn't understand
* Inline request body definitions, AJV doesn't understand schema defined in the method, it has to be in a component
* Body Content-Type validation - Request bodies with multiple content types allowed
