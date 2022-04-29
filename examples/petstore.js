const yaml = require('yaml-js');
const fs = require('fs-extra');
const path = require('path');

const { OpenApiValidator } = require('../dist/index');

const spec = fs.readFile(path.join(__dirname, './petstore.yml')).then(file => yaml.load(file.toString()));

const openApiValidator = new OpenApiValidator({ apiSpec: spec });
const validator = openApiValidator.createValidator();

async function passesValidation() {
  const newRequest = {
    // Method
    method: 'GET',
    // Matched openapi specification generic route
    route: '/pets/{petId}',

    // expected headers
    headers: { Authorization: 'Bearer Token' },
    
    // There's no query on this endpoint
    // query: { limit: 10 },

    // There's no body on the get
    // body: { field: true },
    
    // Path parameters
    pathParameters: { petId: 'my-first-cat' }
  };

  await validator(newRequest);
  console.log('Success: The passed in parameters match the spec');
}

async function failsValidation() {
  const newRequest = {
    // Method
    method: 'GET',
    // Matched openapi specification generic route
    route: '/pets/{petId}',

    // Invalid path parameters, missing expected `petId` in the path, so this will cause an error.
    path: { otherParameterNotPetId: 'my-first-cat' }
  };

  try {
    await validator(newRequest);
  } catch (error) {
    console.log(error.message);
    // Bad Request: request.path must have required property 'petId', request.path must NOT have additional properties

    console.log(error.errors);
    /*
    [
      {
        path: '.path.petId',
        message: "must have required property 'petId'",
        fullMessage: 'missing required property request.path.petId'
      },
      {
        path: '.path.otherParameterNotPetId',
        message: 'must NOT have additional properties',
        fullMessage: "request.path must NOT have additional property: 'otherParameterNotPetId'"
      }
    ]
    */
  }
}

passesValidation();
failsValidation();
