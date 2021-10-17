require('error-object-polyfill');
const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const { DateTime } = require('luxon');
const sinon = require('sinon');
const { OpenApiValidator } = require('../dist/index');

let sandbox;
beforeEach(() => { sandbox = sinon.createSandbox(); });
afterEach(() => sandbox.restore());

const resourceManager = {
  primaryResourceUriPattern: '([a-zA-Z0-9-_.:+=|@]{1,128})',
  resourceUriPattern: '(([a-zA-Z0-9-_.:+=|@]{1,128})|[*])'
};

class ModelValidator {
  constructor() {
    this.validator = null;
    this.validationAsync = null;
  }

  getValidator() {
    if (this.validator) {
      return this.validator;
    }

    const spec = import('./openapi.js').then(doc => doc.default);
    const openApiValidator = new OpenApiValidator({ apiSpec: spec, validateRequests: { allowUnknownQueryParameters: false } });
    return this.validator = openApiValidator.createValidator();
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
      throw Error.create({ title: `InvalidRequest: ${sanitizedErrorMessage}.` }, 'InvalidInputRequest');
    }
  }
}

const modelValidator = new ModelValidator();

describe('modelValidator.js', () => {
  describe('validateSpec', () => {
    it('CreateAndValidateSpec', () => {
      const spec = require('./openapi');
      const oav = new OpenApiValidator({ apiSpec: spec, validateApiSpec: true, validateRequests: { allowUnknownQueryParameters: false } });
      const validator = oav.createValidator();
      expect(validator).to.not.eql(null, 'Request validation function must be a function');
    });
  });

  describe('validate()', () => {
    const tests = {};
    tests[Symbol.iterator] = function* () {
      yield {
        name: 'Success',
        request: {
          path: '/v1/users/Users%7Cgoogle-oauth2%7C108076944510346272539/resources/Billing&3AAccountBilling/permissions/UPDATE',
          httpMethod: 'GET',
          headers: { 'Authorization': 'Bearer AUTH', 'Host': 'test13.api.authress.io', 'User-Agent': 'Amazon CloudFront' },
          queryStringParameters: {},
          pathParameters: {
            userId: 'Users|google-oauth2|108076944510346272539',
            resourceUri: 'BillingService:AccountBilling',
            permission: 'UPDATE'
          },
          route: '/v1/users/{userId}/resources/{resourceUri}/permissions/{permission}'
        },
        expectedExceptionObject: null
      };

      yield {
        name: 'Success with multiple paths',
        request: {
          path: '/v1/users/Users%7Cgoogle-oauth2%7C108076944510346272539/resources/Billing&3AAccountBilling/permissions/UPDATE',
          httpMethod: 'GET',
          headers: { 'Authorization': 'Bearer AUTH', 'Host': 'test13.api.authress.io', 'User-Agent': 'Amazon CloudFront' },
          queryStringParameters: {},
          pathParameters: {
            userId: 'Users|google-oauth2|108076944510346272539',
            resourceUri: 'BillingService:AccountBilling/sub-resource/',
            permission: 'UPDATE'
          },
          route: '/v1/users/{userId}/resources/{resourceUri}/permissions/{permission}'
        },
        expectedExceptionObject: null
      };

      yield {
        name: 'Success with multiple paths ending not with slash',
        request: {
          path: '/v1/users/Users%7Cgoogle-oauth2%7C108076944510346272539/resources/Billing&3AAccountBilling/permissions/UPDATE',
          httpMethod: 'GET',
          headers: { 'Authorization': 'Bearer AUTH', 'Host': 'test13.api.authress.io', 'User-Agent': 'Amazon CloudFront' },
          queryStringParameters: {},
          pathParameters: {
            userId: 'Users|google-oauth2|108076944510346272539',
            resourceUri: 'BillingService:AccountBilling/sub-resource',
            permission: 'UPDATE'
          },
          route: '/v1/users/{userId}/resources/{resourceUri}/permissions/{permission}'
        },
        expectedExceptionObject: null
      };

      yield {
        name: 'ResourceUri is too long',
        request: {
          path: '/v1/users/Users%7Cgoogle-oauth2%7C108076944510346272539/resources/Billing&3AAccountBilling/permissions/UPDATE',
          httpMethod: 'GET',
          headers: { 'Authorization': 'Bearer AUTH', 'Host': 'test13.api.authress.io', 'User-Agent': 'Amazon CloudFront' },
          queryStringParameters: {},
          pathParameters: {
            userId: 'Users|google-oauth2|108076944510346272539',
            resourceUri: Array.from({ length: 1024 }).join(' '),
            permission: 'UPDATE'
          },
          route: '/v1/users/{userId}/resources/{resourceUri}/permissions/{permission}'
        },
        expectedExceptionObject: { title: `InvalidRequest: request.path.resourceUri must NOT have more than 512 characters, request.path.resourceUri must match pattern "^([*]|[/]?${resourceManager.primaryResourceUriPattern}([/]${resourceManager.resourceUriPattern}){0,9}([/][*]|[/]|)?)$".` }
      };

      yield {
        name: 'ResourceUri Allow 128 length subpaths',
        request: {
          path: '/v1/users/Users%7Cgoogle-oauth2%7C108076944510346272539/resources/Billing&3AAccountBilling/permissions/UPDATE',
          httpMethod: 'GET',
          headers: { 'Authorization': 'Bearer AUTH', 'Host': 'test13.api.authress.io', 'User-Agent': 'Amazon CloudFront' },
          queryStringParameters: {},
          pathParameters: {
            userId: 'Users|google-oauth2|108076944510346272539',
            resourceUri: `/TopLevel/${Array.from({ length: 128 }).join('a')}/${Array.from({ length: 128 }).join('b')}/${Array.from({ length: 128 }).join('c')}`,
            permission: 'UPDATE'
          },
          route: '/v1/users/{userId}/resources/{resourceUri}/permissions/{permission}'
        },
        expectedExceptionObject: null
      };

      yield {
        name: 'ResourceUri sub path is too long',
        request: {
          path: '/v1/users/Users%7Cgoogle-oauth2%7C108076944510346272539/resources/Billing&3AAccountBilling/permissions/UPDATE',
          httpMethod: 'GET',
          headers: { 'Authorization': 'Bearer AUTH', 'Host': 'test13.api.authress.io', 'User-Agent': 'Amazon CloudFront' },
          queryStringParameters: {},
          pathParameters: {
            userId: 'Users|google-oauth2|108076944510346272539',
            resourceUri: `/TopLevel/${Array.from({ length: 130 }).join('a')}`,
            permission: 'UPDATE'
          },
          route: '/v1/users/{userId}/resources/{resourceUri}/permissions/{permission}'
        },
        expectedExceptionObject: { title: `InvalidRequest: request.path.resourceUri must match pattern "^([*]|[/]?${resourceManager.primaryResourceUriPattern}([/]${resourceManager.resourceUriPattern}){0,9}([/][*]|[/]|)?)$".` }
      };

      yield {
        name: 'Disallow multiple "//"',
        request: {
          path: '/v1/users/Users%7Cgoogle-oauth2%7C108076944510346272539/resources/Billing&3AAccountBilling/permissions/UPDATE',
          httpMethod: 'GET',
          headers: { 'Authorization': 'Bearer AUTH', 'Host': 'test13.api.authress.io', 'User-Agent': 'Amazon CloudFront' },
          queryStringParameters: {},
          pathParameters: {
            userId: 'Users|google-oauth2|108076944510346272539',
            resourceUri: '/TopLevel//',
            permission: 'UPDATE'
          },
          route: '/v1/users/{userId}/resources/{resourceUri}/permissions/{permission}'
        },
        expectedExceptionObject: { title: `InvalidRequest: request.path.resourceUri must match pattern "^([*]|[/]?${resourceManager.primaryResourceUriPattern}([/]${resourceManager.resourceUriPattern}){0,9}([/][*]|[/]|)?)$".` }
      };

      yield {
        name: 'Disallow multiple "//" followed by a "*"',
        request: {
          path: '/v1/users/Users%7Cgoogle-oauth2%7C108076944510346272539/resources/Billing&3AAccountBilling/permissions/UPDATE',
          httpMethod: 'GET',
          headers: { 'Authorization': 'Bearer AUTH', 'Host': 'test13.api.authress.io', 'User-Agent': 'Amazon CloudFront' },
          queryStringParameters: {},
          pathParameters: {
            userId: 'Users|google-oauth2|108076944510346272539',
            resourceUri: '/TopLevel//*',
            permission: 'UPDATE'
          },
          route: '/v1/users/{userId}/resources/{resourceUri}/permissions/{permission}'
        },
        expectedExceptionObject: { title: `InvalidRequest: request.path.resourceUri must match pattern "^([*]|[/]?${resourceManager.primaryResourceUriPattern}([/]${resourceManager.resourceUriPattern}){0,9}([/][*]|[/]|)?)$".` }
      };

      yield {
        name: 'Disallow multiple "//" In the middle',
        request: {
          path: '/v1/users/Users%7Cgoogle-oauth2%7C108076944510346272539/resources/Billing&3AAccountBilling/permissions/UPDATE',
          httpMethod: 'GET',
          headers: { 'Authorization': 'Bearer AUTH', 'Host': 'test13.api.authress.io', 'User-Agent': 'Amazon CloudFront' },
          queryStringParameters: {},
          pathParameters: {
            userId: 'Users|google-oauth2|108076944510346272539',
            resourceUri: '/TopLevel//subResource',
            permission: 'UPDATE'
          },
          route: '/v1/users/{userId}/resources/{resourceUri}/permissions/{permission}'
        },
        expectedExceptionObject: { title: `InvalidRequest: request.path.resourceUri must match pattern "^([*]|[/]?${resourceManager.primaryResourceUriPattern}([/]${resourceManager.resourceUriPattern}){0,9}([/][*]|[/]|)?)$".` }
      };

      yield {
        name: 'ResourceUri is star *',
        request: {
          path: '/v1/users/Users%7Cgoogle-oauth2%7C108076944510346272539/resources/*/permissions/UPDATE',
          httpMethod: 'GET',
          headers: { 'Authorization': 'Bearer AUTH', 'Host': 'test13.api.authress.io', 'User-Agent': 'Amazon CloudFront' },
          queryStringParameters: {},
          pathParameters: {
            userId: 'Users|google-oauth2|108076944510346272539',
            resourceUri: '*',
            permission: 'UPDATE'
          },
          route: '/v1/users/{userId}/resources/{resourceUri}/permissions/{permission}'
        },
        expectedExceptionObject: null
      };

      // If this test fails due to changes in the openapi spec of changes to the path specified below, change it to a different path
      // * This test is meant to validate the skipFallback functionality, not anything else
      yield {
        name: 'Validation failure on extra query parameters with skipping the fallback',
        request: {
          path: '/v1/roles?badQuery=true',
          httpMethod: 'GET',
          queryStringParameters: {
            badQuery: true
          },
          route: '/v1/roles'
        },
        expectedExceptionObject: {
          title: "InvalidRequest: Unknown query parameter 'badQuery'."
        },
        skipFallback: true
      };

      yield {
        name: 'Invite with email works Success',
        request: {
          path: '/v1/invites',
          httpMethod: 'POST',
          headers: { 'Authorization': 'Bearer AUTH', 'Host': 'test13.api.authress.io', 'User-Agent': 'Amazon CloudFront' },
          queryStringParameters: {},
          pathParameters: {},
          route: '/v1/invites',
          body: {
            email: 'testemail@test.email',
            statements: [{ roles: ['Authress:Owner'], resources: [{ resourceUri: 'Authress:*' }] }]
          }
        },
        expectedExceptionObject: null
      };

      yield {
        name: 'Invalid statement in invite',
        request: {
          path: '/v1/invites',
          httpMethod: 'POST',
          headers: { 'Authorization': 'Bearer AUTH', 'Host': 'test13.api.authress.io', 'User-Agent': 'Amazon CloudFront' },
          queryStringParameters: {},
          pathParameters: {},
          route: '/v1/invites',
          body: {
            email: 'testemail@test.email',
            statements: [{ badParameter: ['Authress:Owner'], resources: [{ resourceUri: 'Authress:*' }] }]
          }
        },
        expectedExceptionObject: { title: "InvalidRequest: request.body.statements[0] must have required property 'roles', request.body.statements[0] must NOT have additional properties." }
      };

      yield {
        name: 'Success on permission',
        request: {
          path: '/v1/users/Users%7Cgoogle-oauth2%7C108076944510346272539/resources/Billing&3AAccountBilling/permissions/UPDATE',
          httpMethod: 'GET',
          headers: { 'Authorization': 'Bearer AUTH', 'Host': 'test13.api.authress.io', 'User-Agent': 'Amazon CloudFront' },
          queryStringParameters: {},
          pathParameters: {
            userId: 'Users|google-oauth2|108076944510346272539',
            resourceUri: 'BillingService:AccountBilling',
            permission: 'UPDATE'
          },
          route: '/v1/users/{userId}/resources/{resourceUri}/permissions/{permission}'
        },
        expectedExceptionObject: null
      };

      // Disabled due to the way DDB sorting works. Since no one used this we can add it in at a later point, possible using a substitution to another character such as '%' => '»%'
      // (or anything else from https://www.ascii-code.com/)
      // yield {
      //   name: 'Success on resource with %',
      //   request: {
      //     path: `/v1/users/Users%7Cgoogle-oauth2%7C108076944510346272539/resources/${encodeURIComponent('BillingService:Account%20 Billing')}/permissions/UPDATE`,
      //     httpMethod: 'GET',
      //     headers: { 'Authorization': 'Bearer AUTH', 'Host': 'test13.api.authress.io', 'User-Agent': 'Amazon CloudFront' },
      //     queryStringParameters: {},
      //     pathParameters: {
      //       userId: 'Users|google-oauth2|108076944510346272539',
      //       resourceUri: encodeURIComponent('BillingService:Account%20 Billing'),
      //       permission: 'UPDATE'
      //     },
      //     route: '/v1/users/{userId}/resources/{resourceUri}/permissions/{permission}'
      //   },
      //   expectedExceptionObject: null
      // };

      yield {
        name: 'Failed an empty space is not allowed',
        request: {
          path: '/v1/users/Users%7Cgoogle-oauth2%7C108076944510346272539/resources/Account%20Billing/permissions/UPDATE',
          httpMethod: 'GET',
          headers: { 'Authorization': 'Bearer AUTH', 'Host': 'test13.api.authress.io', 'User-Agent': 'Amazon CloudFront' },
          queryStringParameters: {},
          pathParameters: {
            userId: 'Users|google-oauth2|108076944510346272539',
            resourceUri: 'BillingService:Account Billing',
            permission: 'UPDATE'
          },
          route: '/v1/users/{userId}/resources/{resourceUri}/permissions/{permission}'
        },
        expectedExceptionObject: { title: `InvalidRequest: request.path.resourceUri must match pattern "^([*]|[/]?${resourceManager.primaryResourceUriPattern}([/]${resourceManager.resourceUriPattern}){0,9}([/][*]|[/]|)?)$".` }
      };

      yield {
        name: 'Success on permission with multiple :',
        request: {
          path: '/v1/users/Users%7Cgoogle-oauth2%7C108076944510346272539/resources/Billing&3AAccountBilling/permissions/UPDATE',
          httpMethod: 'GET',
          headers: { 'Authorization': 'Bearer AUTH', 'Host': 'test13.api.authress.io', 'User-Agent': 'Amazon CloudFront' },
          queryStringParameters: {},
          pathParameters: {
            userId: 'Users|google-oauth2|108076944510346272539',
            resourceUri: 'BillingService:AccountBilling',
            permission: 'UPDATE:account:123:other-resource'
          },
          route: '/v1/users/{userId}/resources/{resourceUri}/permissions/{permission}'
        },
        expectedExceptionObject: null
      };

      yield {
        name: 'Success on permission with *',
        request: {
          path: '/v1/users/Users%7Cgoogle-oauth2%7C108076944510346272539/resources/Billing&3AAccountBilling/permissions/UPDATE',
          httpMethod: 'GET',
          headers: { 'Authorization': 'Bearer AUTH', 'Host': 'test13.api.authress.io', 'User-Agent': 'Amazon CloudFront' },
          queryStringParameters: {},
          pathParameters: {
            userId: 'Users|google-oauth2|108076944510346272539',
            resourceUri: 'BillingService:AccountBilling',
            permission: '*'
          },
          route: '/v1/users/{userId}/resources/{resourceUri}/permissions/{permission}'
        },
        expectedExceptionObject: null
      };

      yield {
        name: 'Failed when permission contains multiple "::"',
        request: {
          path: '/v1/users/Users%7Cgoogle-oauth2%7C108076944510346272539/resources/Billing&3AAccountBilling/permissions/UPDATE',
          httpMethod: 'GET',
          headers: { 'Authorization': 'Bearer AUTH', 'Host': 'test13.api.authress.io', 'User-Agent': 'Amazon CloudFront' },
          queryStringParameters: {},
          pathParameters: {
            userId: 'Users|google-oauth2|108076944510346272539',
            resourceUri: 'BillingService:AccountBilling',
            permission: 'Thing::Else'
          },
          route: '/v1/users/{userId}/resources/{resourceUri}/permissions/{permission}'
        },
        expectedExceptionObject: { title: 'InvalidRequest: request.path.permission must match pattern "^([*]|((?!.*::[*])[a-zA-Z0-9-_]+:?)+(:[*])?)$".' }
      };

      yield {
        name: 'Success when permission allowed to end with *',
        request: {
          path: '/v1/users/Users%7Cgoogle-oauth2%7C108076944510346272539/resources/Billing&3AAccountBilling/permissions/UPDATE',
          httpMethod: 'GET',
          headers: { 'Authorization': 'Bearer AUTH', 'Host': 'test13.api.authress.io', 'User-Agent': 'Amazon CloudFront' },
          queryStringParameters: {},
          pathParameters: {
            userId: 'Users|google-oauth2|108076944510346272539',
            resourceUri: 'BillingService:AccountBilling',
            permission: 'Multiple:permission:*'
          },
          route: '/v1/users/{userId}/resources/{resourceUri}/permissions/{permission}'
        },
        expectedExceptionObject: null
      };

      yield {
        name: 'Success skips validation on non-existent path',
        request: {
          httpMethod: 'GET',
          headers: { 'Authorization': 'Bearer AUTH', 'Host': 'test13.api.authress.io', 'User-Agent': 'Amazon CloudFront' },
          queryStringParameters: {},
          pathParameters: {
            userId: 'Users|google-oauth2|108076944510346272539',
            resourceUri: 'BillingService:AccountBilling',
            permission: 'Multiple:permission:*'
          },
          route: '/vpath/does/not/exist'
        },
        expectedExceptionObject: null
      };

      yield {
        name: 'Success ignoring required readonly property',
        request: {
          httpMethod: 'PUT',
          headers: { 'Authorization': 'Bearer AUTH', 'Host': 'test13.api.authress.io', 'User-Agent': 'Amazon CloudFront' },
          queryStringParameters: {},
          pathParameters: {
            connectionId: 'ConnectionId'
          },
          body: {
            authenticationUrl: 'Auth-URL',
            tokenUrl: 'Token-URL'
          },
          route: '/v1/connections/{connectionId}'
        },
        expectedExceptionObject: null
      };

      yield {
        name: 'Success adding optional header',
        request: {
          httpMethod: 'PUT',
          headers: { 'Authorization': 'Bearer AUTH', 'Host': 'test13.api.authress.io', 'User-Agent': 'Amazon CloudFront', 'If-Unmodified-Since': DateTime.utc().toISO() },
          queryStringParameters: {},
          pathParameters: {
            recordId: 'Test-Record-Id'
          },
          body: {
            name: 'TestRecord',
            users: [],
            statements: [{ roles: ['R'], resources: [{ resourceUri: 'RR' }] }]
          },
          route: '/v1/records/{recordId}'
        },
        expectedExceptionObject: null
      };

      yield {
        name: 'Success query parameters',
        request: {
          httpMethod: 'GET',
          headers: { 'Authorization': 'Bearer AUTH', 'Host': 'test13.api.authress.io', 'User-Agent': 'Amazon CloudFront' },
          queryStringParameters: {
            limit: '10'
          },
          pathParameters: {
            userId: 'Test-User-Id'
          },
          route: '/v1/users/{userId}/resources'
        },
        expectedExceptionObject: null
      };
    };
    for (let test of tests) {
      it(test.name, async () => {
        try {
          modelValidator.startValidation(test.request, test.skipFallback);
          await modelValidator.ensureValidation();
        } catch (error) {
          expect(test.expectedExceptionObject).to.not.eql(null, error);
          expect(error.message).to.eql(test.expectedExceptionObject, error);
          return;
        }
        expect(test.expectedExceptionObject).to.eql(null, test.expectedExceptionObject && test.expectedExceptionObject.title);
      });
    }
  });
});
