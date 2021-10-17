const { DateTime } = require('luxon');
const resourceManager = {
  primaryResourceUriPattern: '([a-zA-Z0-9-_.:+=|@]{1,128})',
  resourceUriPattern: '(([a-zA-Z0-9-_.:+=|@]{1,128})|[*])'
};

const spec = {
  openapi: '3.0.0',
  info: {
    version: 'v1',
    title: 'Authress',
    description: `<p>
<h2>Introduction</h2>
<p>Welcome to the Authress Authorization API.
<br>The Authress REST API provides the operations and resources necessary to create records, assign permissions, and verify any user in your platform.</p>
<p><ul>
  <li>Manage multitenant platforms and create user tenants for SSO connections.</li>
  <li>Create records to assign roles and resources to grant access for users.</li>
  <li>Check user access control by calling the authorization API at the right time.</li>
  <li>Configure service clients to securely access services in your platform.</li>
</ul></p>
<p>For more in-depth scenarios check out the <a href="https://authress.io/knowledge-base" target="_blank">Authress knowledge base</a>.</p>
</p>`,
    contact: {
      name: 'Authress Support',
      email: 'support@authress.io'
    }
  },
  tags: [
    { name: 'User Permissions' },
    { name: 'Groups' },
    { name: 'Roles' },
    { name: 'Access Records' },
    { name: 'Service Clients' },
    { name: 'Resource Permissions' },
    { name: 'Accounts' },
    { name: 'Login Management' }
  ],
  paths: {
    '/v1/users/{userId}/resources': {
      get: {
        summary: 'Get the resources a user has to permission to.',
        operationId: 'getUserResources',
        description: 'Get the users resources. This result is a list of resource uris that a user has an explicit permission to, a user with * access to all sub resources will return an empty list. To get a user\'s list of resources in this cases, it is recommended to also check explicit access to the collection resource, using the <strong>authorizeUser</strong> endpoint. In the case that the user only has access to a subset of resources in a collection, the list will be paginated.',
        tags: ['User Permissions'],

        parameters: [
          {
            name: 'userId',
            in: 'path',
            description: 'The user to check permissions on',
            required: true,
            schema: {
              type: 'string',
              minLength: 1,
              maxLength: 64
            }
          },
          {
            name: 'resourceUri',
            in: 'query',
            description: 'The top level uri path of a resource to query for. Will only match explicit or collection resource children. Will not partial match resource names.',
            required: false,
            schema: {
              type: 'string',
              default: '*',
              pattern: `^([*]|[/]?${resourceManager.primaryResourceUriPattern}([/]${resourceManager.resourceUriPattern}){0,9}([/][*]|[/]|)?|Authress:[*])$`,
              minLength: 1,
              maxLength: 512,
              example: '/organizations/orgId:A/documents/docId:1'
            }
          },
          {
            name: 'permissions',
            in: 'query',
            description: "Permission to check, '*' and scoped permissions can also be checked here. By default if the user has any permission explicitly to a resource, it will be included in the list.",
            required: false,
            schema: {
              $ref: '#/components/schemas/PermissionObject/properties/action'
            }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Max number of results to return',
            required: false,
            schema: {
              type: 'integer',
              format: 'int32',
              nullable: true,
              minimum: 1,
              maximum: 20,
              default: 20
            }
          },
          {
            name: 'cursor',
            in: 'query',
            description: 'Continuation cursor for paging (will automatically be set)',
            required: false,
            schema: {
              type: 'string',
              nullable: true
            }
          }
        ],
        responses: {
          200: {
            description: 'Success.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/UserResources'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          }
        },
        security: [{ oauth2: [] }]
      }
    },
    // '/v1/users/{userId}/resources/{resourceUri}/metadata': {
    //   parameters: [
    //     {
    //       name: 'userId',
    //       in: 'path',
    //       description: 'The owner of the data.',
    //       required: true,
    //       schema: {
    //         type: 'string',
    //         minLength: 1,
    //         maxLength: 64
    //       }
    //     },
    //     {
    //       name: 'resourceUri',
    //       in: 'path',
    //       description: 'The resource the data is attached to.',
    //       required: true,
    //       schema: {
    //         type: 'string',
    //         pattern: `^([*]|[/]?${resourceManager.primaryResourceUriPattern}([/]${resourceManager.resourceUriPattern}){0,9}[/]?|Authress:[*])$`,
    //         minLength: 1,
    //         maxLength: 512,
    //         example: '/organizations/orgId:A/documents/docId:1'
    //       }
    //     }
    //   ],

    //   get: {
    //     summary: 'Get the metadata for a resource.',
    //     operationId: 'getUserMetadata',
    //     description: `Metadata is partitioned by the resource owner, and each can store independent data for a resource. This data is only accessible by identity provider tokens which specify the <strong>sub</strong> property and by service clients which have the <strong>grantMetadataAccess</strong> property.
    //    `,
    //     tags: ['Metadata'],
    //     responses: {
    //       200: {
    //         description: 'Success. The metadata is returned',
    //         content: {
    //           'application/links+json': {
    //             schema: {
    //               $ref: '#/components/schemas/MetadataObject'
    //             }
    //           }
    //         }
    //       },
    //       401: {
    //         description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
    //       },
    //       403: {
    //         description: 'Forbidden. The requestor does not have access to this data.'
    //       },
    //       404: {
    //         description: 'Not found. The data for this resource does not exist.'
    //       }
    //     },
    //     security: [{ oauth2: [] }]
    //   },
    //   put: {
    //     summary: 'Update the metadata for a resource.',
    //     operationId: 'updateUserMetadata',
    //     description: `Each owner can store independent data for a resource. This data is only accessible by identity provider tokens which specify the <strong>sub</strong> property and by service clients which have the <strong>grantMetadataAccess</strong> property. The underlying resource does not need to actually exist in Authress to manage and update the data.
    //    `,
    //     tags: ['Metadata'],

    //     requestBody: {
    //       $ref: '#/components/requestBodies/MetadataRequest'
    //     },

    //     responses: {
    //       200: {
    //         description: 'Success. The metadata is updated',
    //         content: {
    //           'application/links+json': {
    //             schema: {
    //               $ref: '#/components/schemas/MetadataObject'
    //             }
    //           }
    //         }
    //       },
    //       400: {
    //         description: 'Bad Request. The request is invalid for the specified reason.'
    //       },
    //       401: {
    //         description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
    //       },
    //       403: {
    //         description: 'Forbidden. The requestor does not have access to this metadata.'
    //       },
    //       404: {
    //         description: 'Not found. The metadata for this resource does not exist.'
    //       },
    //       422: {
    //         description: 'The metadata body cannot be processed'
    //       }
    //     },
    //     security: [{ oauth2: [] }]
    //   }
    // },
    '/v1/users/{userId}/resources/{resourceUri}/permissions': {
      get: {
        summary: 'Get the permissions a user has to a resource.',
        operationId: 'getUserPermissionsForResource',
        description: 'Get a summary of the permissions a user has to a particular resource.',
        tags: ['User Permissions'],

        parameters: [
          {
            name: 'userId',
            in: 'path',
            description: 'The user to check permissions on',
            required: true,
            schema: {
              type: 'string',
              minLength: 1,
              maxLength: 64
            }
          },
          {
            name: 'resourceUri',
            in: 'path',
            description: 'The uri path of a resource to validate, must be URL encoded, uri segments are allowed.',
            required: true,
            schema: {
              type: 'string',
              // Alternative: `^([*]|[/]?(?!.*\/\/[*])(${resourceManager.resourceUriPattern}\/?){0,9}([/][*]|[/]|)?|Authress:[*])$`
              pattern: `^([*]|[/]?${resourceManager.primaryResourceUriPattern}([/]${resourceManager.resourceUriPattern}){0,9}[/]?|Authress:[*])$`,
              minLength: 1,
              maxLength: 512,
              example: '/organizations/orgId:A/documents/docId:1'
            }
          }
        ],
        responses: {
          200: {
            description: 'Success. The user has permissions',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/PermissionResponse'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          404: {
            description: "Not found. The user doesn't have any permissions to the resource."
          }
        },
        security: [{ oauth2: [] }]
      }
    },
    '/v1/users/{userId}/resources/{resourceUri}/permissions/{permission}': {
      get: {
        summary: 'Check to see if a user has permissions to a resource.',
        operationId: 'authorizeUser',
        description: 'Does the user have the specified permissions to the resource?',
        tags: ['User Permissions'],

        parameters: [
          {
            name: 'userId',
            in: 'path',
            description: 'The user to check permissions on',
            required: true,
            schema: {
              type: 'string',
              minLength: 1,
              maxLength: 64
            }
          },
          {
            name: 'resourceUri',
            in: 'path',
            description: 'The uri path of a resource to validate, must be URL encoded, uri segments are allowed, the resource must be a full path.',
            required: true,
            schema: {
              type: 'string',
              // Pattern should be this, but is currently being consumed incorrectly: `^([*]|[/]?${resourceManager.primaryResourceUriPattern}([/]${resourceManager.resourceUriPattern}){0,9}[/]?|Authress:[*])$`,
              pattern: `^([*]|[/]?${resourceManager.primaryResourceUriPattern}([/]${resourceManager.resourceUriPattern}){0,9}([/][*]|[/]|)?|Authress:[*])$`,
              minLength: 1,
              maxLength: 512,
              example: '/organizations/orgId:A/documents/docId:1'
            }
          },
          {
            name: 'permission',
            in: 'path',
            description: "Permission to check, '*' and scoped permissions can also be checked here.",
            required: true,
            schema: {
              $ref: '#/components/schemas/PermissionObject/properties/action'
            }
          }
        ],
        responses: {
          200: {
            description: 'Success. The user has permissions'
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The requestor of the authorization check doesn't have the required permission to check the user's authorization."
          },
          404: {
            description: "Not found. The user doesn't have any permissions to the resource including the one requested."
          }
        },
        security: [{ oauth2: [] }]
      }
    },
    '/v1/users/{userId}/resources/{resourceUri}/roles': {
      get: {
        summary: 'Get the roles a user has to a resource.',
        operationId: 'getUserRolesForResource',
        description: 'Get a summary of the roles a user has to a particular resource. Users can be assigned roles from multiple access records, this may cause the same role to appear in the list more than once.',
        tags: ['User Permissions'],

        parameters: [
          {
            name: 'userId',
            in: 'path',
            description: 'The user to get roles for.',
            required: true,
            schema: {
              type: 'string',
              minLength: 1,
              maxLength: 64
            }
          },
          {
            name: 'resourceUri',
            in: 'path',
            description: 'The uri path of a resource to get roles for, must be URL encoded. Checks for explicit resource roles, roles attached to parent resources are not returned.',
            required: true,
            schema: {
              type: 'string',
              pattern: `^([*]|[/]?${resourceManager.primaryResourceUriPattern}([/]${resourceManager.resourceUriPattern}){0,9}[/]?|Authress:[*])$`,
              minLength: 1,
              maxLength: 512,
              example: '/organizations/orgId:A/documents/docId:1'
            }
          }
        ],
        responses: {
          200: {
            description: 'Success. The user has roles',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/UserRoleCollection'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          404: {
            description: "Not found. The user doesn't have any permissions to the resource."
          }
        },
        security: [{ oauth2: [] }]
      }
    },
    // '/v1/users/{userId}/tokens': {
    //   post: {
    //     summary: 'Request a user token with additional configuration.',
    //     operationId: 'requestUserToken',
    //     description: `Get an Authress signed JWT access token using with userId as the sub. Additionally, can be configured to limit the permissions for this particular token and the length of time the token is valid. Token validation is real-time, so deleted tokens are restricted from being used as soon as they are deleted. This gives full control to the user and client creating the token. Client must have access to impersonating the user in order to generate tokens on their behalf.
    //     <br><span class="badge badge-outline-secondary">CONTACT: AuthressSupport</span>`,
    //     tags: ['User Permissions'],

    //     parameters: [
    //       {
    //         name: 'userId',
    //         in: 'path',
    //         description: 'The user to create an impersonation token for.',
    //         required: true,
    //         schema: {
    //           type: 'string',
    //           minLength: 1,
    //           maxLength: 64
    //         }
    //       }
    //     ],
    //     requestBody: {
    //       $ref: '#/components/requestBodies/TokenRequest'
    //     },
    //     responses: {
    //       200: {
    //         description: 'Success.',
    //         content: {
    //           'application/links+json': {
    //             schema: {
    //               $ref: '#/components/schemas/UserToken'
    //             }
    //           }
    //         }
    //       },
    //       401: {
    //         description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
    //       }
    //     },
    //     security: [{ oauth2: [] }]
    //   }
    // },
    // '/v1/users/{userId}/tokens/{tokenId}': {
    //   delete: {
    //     summary: 'Disable a token.',
    //     operationId: 'disableUserToken',
    //     description: `Permanently disable a token. To be used after the token has completed its use. Should be called on all tokens to ensure they are not active indefinitely.
    //     <br><span class="badge badge-outline-secondary">CONTACT: AuthressSupport</span>`,
    //     tags: ['User Permissions'],

    //     parameters: [
    //       {
    //         name: 'userId',
    //         in: 'path',
    //         description: 'The user to create an impersonation token for.',
    //         required: true,
    //         schema: {
    //           type: 'string',
    //           minLength: 1,
    //           maxLength: 64
    //         }
    //       },
    //       {
    //         name: 'tokenId',
    //         in: 'path',
    //         description: 'The relevant token identifier',
    //         required: true,
    //         schema: {
    //           type: 'string',
    //           minLength: 1,
    //           maxLength: 64
    //         }
    //       }
    //     ],
    //     responses: {
    //       204: {
    //         description: 'Success.'
    //       },
    //       401: {
    //         description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
    //       }
    //     },
    //     security: [{ oauth2: [] }]
    //   }
    // },

    '/v1/groups': {
      get: {
        summary: 'Get all groups.',
        operationId: 'getGroups',
        description: 'Returns a paginated groups list for the account. Only groups the user has access to are returned. This query resource is meant for administrative actions only, therefore has a lower rate limit tier than user permissions related resources.',
        tags: ['Groups'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Max number of results to return',
            required: false,
            schema: {
              type: 'integer',
              format: 'int32',
              nullable: true,
              minimum: 1,
              maximum: 20,
              default: 20
            }
          },
          {
            name: 'cursor',
            in: 'query',
            description: 'Continuation cursor for paging (will automatically be set)',
            required: false,
            schema: {
              type: 'string',
              nullable: true
            }
          },
          {
            name: 'filter',
            in: 'query',
            description: 'Filter to search groups by. This is a case insensitive search through every text field.',
            required: false,
            schema: {
              type: 'string',
              nullable: true,
              minLength: 1,
              maxLength: 64
            }
          }
        ],
        responses: {
          200: {
            description: 'Success.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/Group'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to fetch groups, but has other account permissions"
          },
          404: {
            description: "Not found. THe user doesn't have permissions to read any group information."
          }
        },
        security: [{ oauth2: [] }]
      },
      post: {
        summary: 'Create a new group.',
        operationId: 'createGroup',
        description: 'Specify users to be included in a new group. (Groups have a maximum size of ~100KB)',
        tags: ['Groups'],

        parameters: [],
        requestBody: {
          $ref: '#/components/requestBodies/Group'
        },
        responses: {
          201: {
            description: 'Success. Group created',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/Group'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to create groups."
          },
          404: {
            description: "Not found. The user doesn't have permission to update the account."
          },
          413: {
            description: 'The size of the group is larger than allowed. Recommended action is to create another group and retry the updates.'
          }
        },
        security: [{ oauth2: [] }]
      }
    },
    '/v1/groups/{groupId}': {
      parameters: [
        {
          name: 'groupId',
          in: 'path',
          description: 'The identifier of the group.',
          required: true,
          schema: {
            type: 'string',
            pattern: '^[a-zA-Z0-9-_]+$',
            minLength: 1,
            maxLength: 32
          }
        }
      ],

      get: {
        summary: 'Get a group for the account.',
        operationId: 'getGroup',
        description: 'A group contains multiple users which can be added to an access record, and should be assigned the same roles at the same time.',
        tags: ['Groups'],

        responses: {
          200: {
            description: 'Success.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/Group'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to the group, but they have other permissions to the same account."
          },
          404: {
            description: "Not found. The user doesn't have any permissions to the group or this group does not exist."
          }
        },
        security: [{ oauth2: [] }]
      },
      put: {
        summary: 'Update a group.',
        operationId: 'updateGroup',
        description: 'Updates a group adding or removing user. Change a group updates the permissions and roles the users have access to. (Groups have a maximum size of ~100KB)',
        tags: ['Groups'],
        requestBody: {
          $ref: '#/components/requestBodies/Group'
        },
        responses: {
          200: {
            description: 'Success. Group updated.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/Group'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to update the group."
          },
          404: {
            description: "Not found. The user doesn't have any permissions to the group."
          },
          413: {
            description: 'The size of the group is larger than allowed. Recommended action is to create another group and retry the updates.'
          }
        },
        security: [{ oauth2: [] }]
      },
      delete: {
        summary: 'Deletes a group.',
        operationId: 'deleteGroup',
        description: 'Remove a group, users will lose any role that was assigned through membership of this group. This action cannot be undone.',
        tags: ['Groups'],

        responses: {
          204: {
            description: 'Success. The group has been deleted'
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to delete the group."
          },
          404: {
            description: "Not found. The user doesn't have any permissions to the resource or the group no longer exists."
          }
        },
        security: [{ oauth2: [] }]
      }
    },

    '/v1/resources': {
      get: {
        summary: 'List resource configurations.',
        operationId: 'getResources',
        description: 'Permissions can be set globally at a resource level. Lists any resources with a globally set resource policy.',
        tags: ['Resource Permissions'],

        responses: {
          200: {
            description: 'Success.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/ResourcePermissionCollection'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          404: {
            description: "Not found. The user doesn't have permission to the resource."
          }
        },
        security: [{ oauth2: [] }]
      }
    },
    '/v1/resources/{resourceUri}': {
      parameters: [
        {
          name: 'resourceUri',
          in: 'path',
          description: 'The uri path of a resource to validate, must be URL encoded, uri segments are allowed.',
          required: true,
          schema: {
            type: 'string',
            pattern: `^([*]|[/]?${resourceManager.primaryResourceUriPattern}([/]${resourceManager.resourceUriPattern}){0,9}[/]?|Authress:[*])$`,
            minLength: 1,
            maxLength: 512,
            example: '/organizations/orgId:A/documents/docId:1'
          }
        }
      ],

      get: {
        summary: 'Get a resource permissions object.',
        operationId: 'getResourcePermissions',
        description: 'Permissions can be set globally at a resource level. This will apply to all users in an account.',
        tags: ['Resource Permissions'],

        responses: {
          200: {
            description: 'Success.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/ResourcePermission'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          404: {
            description: "Not found. The user doesn't have permission to the resource."
          }
        },
        security: [{ oauth2: [] }]
      },
      put: {
        summary: 'Update a resource permissions object.',
        operationId: 'updateResourcePermissions',
        description: 'Updates the global permissions on a resource. This applies to all users in an account.',
        tags: ['Resource Permissions'],

        requestBody: {
          $ref: '#/components/requestBodies/ResourcePermission'
        },
        responses: {
          200: {
            description: 'Success.'
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to the resource, but they have other permissions to the same resource."
          },
          404: {
            description: "Not found. The user doesn't have permission to the resource."
          }
        },
        security: [{ oauth2: [] }]
      }
    },

    '/v1/resources/{resourceUri}/users': {
      get: {
        summary: 'Get the users that have explicit access to this resource.',
        operationId: 'getResourceUsers',
        description: 'Get the resource users. This result is a list of users that have some permission to the resource. Users with access to parent resources and users with access only to a sub-resource will not be returned in this result. In the case that the resource has multiple users, the list will be paginated.',
        tags: ['Resource Permissions'],

        parameters: [
          {
            name: 'resourceUri',
            in: 'path',
            description: 'The uri path of a resource to validate, must be URL encoded, uri segments are allowed.',
            required: true,
            schema: {
              type: 'string',
              pattern: `^([*]|[/]?${resourceManager.primaryResourceUriPattern}([/]${resourceManager.resourceUriPattern}){0,9}[/]?|Authress:[*])$`,
              minLength: 1,
              maxLength: 512,
              example: '/organizations/orgId:A/documents/docId:1'
            }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Max number of results to return',
            required: false,
            schema: {
              type: 'integer',
              format: 'int32',
              nullable: true,
              minimum: 1,
              maximum: 20,
              default: 20
            }
          },
          {
            name: 'cursor',
            in: 'query',
            description: 'Continuation cursor for paging (will automatically be set)',
            required: false,
            schema: {
              type: 'string',
              nullable: true
            }
          }
        ],
        responses: {
          200: {
            description: 'Success.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/ResourceUsersCollection'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          }
        },
        security: [{ oauth2: [] }]
      }
    },
    '/v1/records': {
      get: {
        summary: 'Get all account records.',
        operationId: 'getRecords',
        description: 'Returns a paginated records list for the account. Only records the user has access to are returned. This query resource is meant for administrative actions only, therefore has a lower rate limit tier than user permissions related resources.',
        tags: ['Access Records'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Max number of results to return',
            required: false,
            schema: {
              type: 'integer',
              format: 'int32',
              nullable: true,
              minimum: 1,
              maximum: 20,
              default: 20
            }
          },
          {
            name: 'cursor',
            in: 'query',
            description: 'Continuation cursor for paging (will automatically be set)',
            required: false,
            schema: {
              type: 'string',
              nullable: true
            }
          },
          {
            name: 'filter',
            in: 'query',
            description: 'Filter to search records by. This is a case insensitive search through every text field.',
            required: false,
            schema: {
              type: 'string',
              nullable: true,
              minLength: 1,
              maxLength: 64
            }
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter records by their current status.',
            required: false,
            schema: {
              type: 'string',
              nullable: true,
              enum: ['ACTIVE', 'DELETED']
            }
          }
        ],
        responses: {
          200: {
            description: 'Success.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/AccessRecordCollection'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to fetch account records, but has other account permissions"
          },
          404: {
            description: "Not found. THe user doesn't have permissions to read any account information."
          }
        },
        security: [{ oauth2: [] }]
      },
      post: {
        summary: 'Create a new access record.',
        operationId: 'createRecord',
        description: 'Specify user roles for specific resources. (Records have a maximum size of ~100KB)',
        tags: ['Access Records'],

        parameters: [],
        requestBody: {
          $ref: '#/components/requestBodies/AccessRecord'
        },
        responses: {
          201: {
            description: 'Success. Access record created',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/AccessRecord'
                }
              }
            },
            headers: {
              'Last-Modified': {
                description: 'The expected last time the record was modified. (<a href="https://tools.ietf.org/html/rfc7231#section-7.1.1.1" target="_blank">format</a>)',
                schema: {
                  type: 'string'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to create records."
          },
          404: {
            description: "Not found. The user doesn't have permission to update the account."
          }
        },
        security: [{ oauth2: [] }]
      }
    },
    '/v1/records/{recordId}': {
      parameters: [
        {
          name: 'recordId',
          in: 'path',
          description: 'The identifier of the access record.',
          required: true,
          schema: {
            type: 'string',
            pattern: '^[a-zA-Z0-9-_:|~]+$',
            minLength: 1,
            maxLength: 100
          }
        }
      ],

      get: {
        summary: 'Get an access record for the account.',
        operationId: 'getRecord',
        description: 'Access records contain information assigning permissions to users for resources.',
        tags: ['Access Records'],

        responses: {
          200: {
            description: 'Success.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/AccessRecord'
                }
              }
            },
            headers: {
              'Last-Modified': {
                description: 'The expected last time the record was modified. (<a href="https://tools.ietf.org/html/rfc7231#section-7.1.1.1" target="_blank">format</a>)',
                schema: {
                  type: 'string'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to the access record, but they have other permissions to the same account."
          },
          404: {
            description: "Not found. The user doesn't have any permissions to the access record or this access record does not exist."
          }
        },
        security: [{ oauth2: [] }]
      },
      put: {
        summary: 'Update an access record.',
        operationId: 'updateRecord',
        description: 'Updates an access record adding or removing user permissions to resources. (Records have a maximum size of ~100KB)',
        tags: ['Access Records'],

        parameters: [{
          name: 'If-Unmodified-Since',
          in: 'header',
          description: 'The expected last time the record was modified. (<a href="https://tools.ietf.org/html/rfc7231#section-7.1.1.1" target="_blank">format</a>)',
          required: false,
          schema: {
            type: 'string',
            minLength: 1,
            maxLength: 32
          },
          example: DateTime.local().toHTTP()
        }],
        requestBody: {
          $ref: '#/components/requestBodies/AccessRecord'
        },
        responses: {
          200: {
            description: 'Success. Access record updated.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/AccessRecord'
                }
              }
            },
            headers: {
              'Last-Modified': {
                description: 'The expected last time the record was modified. (<a href="https://tools.ietf.org/html/rfc7231#section-7.1.1.1" target="_blank">format</a>)',
                schema: {
                  type: 'string'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to update the access record."
          },
          404: {
            description: "Not found. The user doesn't have any permissions to the access record."
          },
          412: {
            description: 'Precondition failed. Usually the result of a concurrent update to the access record. Get the latest version and retry again.',
            headers: {
              'Last-Modified': {
                description: 'The expected last time the record was modified. (<a href="https://tools.ietf.org/html/rfc7231#section-7.1.1.1" target="_blank">format</a>)',
                schema: {
                  type: 'string'
                }
              }
            }
          },
          413: {
            description: 'The size of the record is larger than allowed. Recommended action is to create another record and retry the updates.'
          }
        },
        security: [{ oauth2: [] }]
      },
      delete: {
        summary: 'Deletes an access record.',
        operationId: 'deleteRecord',
        description: 'Remove an access record, removing associated permissions from all users in record. If a user has a permission from another record, that permission will not be removed. (Note: This disables the record by changing the status to <strong>DELETED</strong> but not completely remove the record for tracking purposes.',
        tags: ['Access Records'],

        responses: {
          204: {
            description: 'Success. The access record has been deleted'
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to delete the access record."
          },
          404: {
            description: "Not found. The user doesn't have any permissions to the resource or the access record no longer exists."
          }
        },
        security: [{ oauth2: [] }]
      }
    },
    '/v1/invites': {
      post: {
        summary: 'Create a new invite.',
        operationId: 'createInvite',
        description: 'Invites are used to easily assign permissions to users that have not been created in your identity provider yet. Create the invite with an email address, and then when the user accepts the invite they will automatically get the permissions assigned here. Invites automatically expire after 7 days.',
        tags: ['Access Records'],

        parameters: [],
        requestBody: {
          $ref: '#/components/requestBodies/Invite'
        },
        responses: {
          201: {
            description: 'Success. Invite created',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/Invite'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have the permissions to create an invite. They may have specified too many permissions in the invite."
          },
          404: {
            description: "Not found. The user doesn't have access to the account."
          }
        },
        security: [{ oauth2: [] }]
      }
    },
    '/v1/invites/{inviteId}': {
      parameters: [
        {
          name: 'inviteId',
          in: 'path',
          description: 'The identifier of the invite.',
          required: true,
          schema: {
            type: 'string',
            minLength: 1,
            maxLength: 256
          }
        }
      ],

      delete: {
        summary: 'Delete an invite.',
        operationId: 'deleteInvite',
        description: 'Deletes an invite.',
        tags: ['Access Records'],

        responses: {
          204: {
            description: 'Success. Invite deleted.'
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to delete the invite."
          },
          404: {
            description: "Not found. The user doesn't have any permissions to the invite."
          }
        },
        security: [{ oauth2: [] }]
      },
      patch: {
        summary: 'Accept an invite.',
        operationId: 'respondToInvite',
        description: 'Accepts an invite by claiming this invite by this user. The user token used for this request will gain the permissions associated with the invite.',
        tags: ['Access Records'],

        responses: {
          200: {
            description: 'Success. Invite accepted.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/Account'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to update the access record."
          },
          404: {
            description: "Not found. The user doesn't have any permissions to the access record."
          }
        },
        security: [{ oauth2: [] }]
      }
    },
    '/v1/requests': {
      get: {
        summary: 'Get all access requests.',
        operationId: 'getRequests',
        description: 'Returns a paginated request list. Only requests the user has access to are returned. This query resource is meant for administrative actions only, therefore has a lower rate limit tier than user permissions related resources.',
        tags: ['Access Records'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Max number of results to return',
            required: false,
            schema: {
              type: 'integer',
              format: 'int32',
              nullable: true,
              minimum: 1,
              maximum: 20,
              default: 20
            }
          },
          {
            name: 'cursor',
            in: 'query',
            description: 'Continuation cursor for paging (will automatically be set)',
            required: false,
            schema: {
              type: 'string',
              nullable: true
            }
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter records by their current status.',
            required: false,
            schema: {
              type: 'string',
              nullable: true,
              enum: ['OPEN', 'APPROVED', 'DENIED']
            }
          }
        ],
        responses: {
          200: {
            description: 'Success.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/AccessRequestCollection'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to fetch access requests, but has other account permissions"
          },
          404: {
            description: "Not found. THe user doesn't have permissions to read any account information."
          }
        },
        security: [{ oauth2: [] }]
      },
      post: {
        summary: 'Create a new access request.',
        operationId: 'createRequest',
        description: 'Specify a request in the form of an access record that an admin can approve.',
        tags: ['Access Records'],

        parameters: [],
        requestBody: {
          $ref: '#/components/requestBodies/AccessRequest'
        },
        responses: {
          201: {
            description: 'Success. Access request created',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/AccessRequest'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to create access requests."
          },
          404: {
            description: "Not found. The user doesn't have permission to update the account."
          },
          422: {
            description: 'Unprocessable Entity. Some of the data in the request is invalid.'
          }
        },
        security: [{ oauth2: [] }]
      }
    },
    '/v1/requests/{requestId}': {
      parameters: [
        {
          name: 'requestId',
          in: 'path',
          description: 'The identifier of the access request.',
          required: true,
          schema: {
            type: 'string',
            pattern: '^[a-zA-Z0-9-_:|~]+$',
            minLength: 1,
            maxLength: 100
          }
        }
      ],

      get: {
        summary: 'Get an access request for the account.',
        operationId: 'getRequest',
        description: 'Access request contain information requesting permissions for users to resources.',
        tags: ['Access Records'],

        responses: {
          200: {
            description: 'Success.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/AccessRequest'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to the access request, but they have other permissions to the same account."
          },
          404: {
            description: "Not found. The user doesn't have any permissions to the access request or this access request does not exist."
          }
        },
        security: [{ oauth2: [] }]
      },
      patch: {
        summary: 'Approve or deny an access request.',
        operationId: 'respondToAccessRequest',
        description: 'Updates an access request, approving it or denying it.',
        tags: ['Access Records'],

        parameters: [],
        requestBody: {
          $ref: '#/components/requestBodies/AccessRequestResponse'
        },
        responses: {
          200: {
            description: 'Success. Access record updated.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/AccessRequest'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to update the access request."
          },
          404: {
            description: "Not found. The user doesn't have any permissions to the access request."
          }
        },
        security: [{ oauth2: [] }]
      },
      delete: {
        summary: 'Deletes an access request.',
        operationId: 'deleteRequest',
        description: 'Remove an access request.',
        tags: ['Access Records'],

        responses: {
          204: {
            description: 'Success. The access request has been deleted'
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to delete the access request."
          },
          404: {
            description: "Not found. The user doesn't have any permissions to the access request or it no longer exists."
          }
        },
        security: [{ oauth2: [] }]
      }
    },
    '/v1/roles': {
      post: {
        summary: 'Create a role.',
        operationId: 'createRole',
        description: 'Creates a role with permissions.',
        tags: ['Roles'],

        requestBody: {
          $ref: '#/components/requestBodies/Role'
        },
        responses: {
          201: {
            description: 'Success. Role created.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/Role'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to the role, but they have other permissions to the same account."
          }
        },
        security: [{ oauth2: [] }]
      },
      get: {
        summary: 'Get all roles.',
        operationId: 'getRoles',
        description: 'Get all the account roles. Roles contain a list of permissions that will be applied to any user or resource',
        tags: ['Roles'],

        responses: {
          200: {
            description: 'Success.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/RoleCollection'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to account roles, but they have other permissions to the same account."
          }
        },
        security: [{ oauth2: [] }]
      }
    },
    '/v1/roles/{roleId}': {
      parameters: [
        {
          name: 'roleId',
          in: 'path',
          description: 'The identifier of the role.',
          required: true,
          schema: {
            type: 'string',
            pattern: '^[a-zA-Z0-9-._:@]+$',
            minLength: 1,
            maxLength: 64
          }
        }
      ],

      get: {
        summary: 'Get a role.',
        operationId: 'getRole',
        description: 'Roles contain a list of permissions that will be applied to any user or resource',
        tags: ['Roles'],

        responses: {
          200: {
            description: 'Success.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/Role'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to the role, but they have other permissions to the same account."
          },
          404: {
            description: "Not found. The user doesn't have any permissions to the role or this role does not exist."
          }
        },
        security: [{ oauth2: [] }]
      },
      put: {
        summary: 'Update a role.',
        operationId: 'updateRole',
        description: 'Updates a role adding or removing permissions.',
        tags: ['Roles'],

        requestBody: {
          $ref: '#/components/requestBodies/Role'
        },
        responses: {
          200: {
            description: 'Success. Role updated.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/Role'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to the role, but they have other permissions to the same account."
          },
          404: {
            description: "Not found. The user doesn't have any permissions to the role or this role does not exist."
          }
        },
        security: [{ oauth2: [] }]
      },
      delete: {
        summary: 'Deletes a role.',
        operationId: 'deleteRole',
        description: 'Remove a role. If a record references the role, that record will not be modified.',
        tags: ['Roles'],

        responses: {
          204: {
            description: 'Success. The role has been deleted'
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to delete the role."
          },
          404: {
            description: "Not found. The user doesn't have any permissions to the resource or the role no longer exists."
          }
        },
        security: [{ oauth2: [] }]
      }
    },
    '/v1/claims': {
      post: {
        summary: 'Claim a resource by an allowed user.',
        operationId: 'createClaim',
        description: 'Claim a resource by allowing a user to pick an identifier and receive admin access to that resource if it hasn\'t already been claimed. This only works for resources specifically marked as <strong>CLAIM</strong>. The result will be a new access record listing that user as the admin for this resource. The resourceUri will be appended to the collection resource uri using a \'/\' (forward slash) automatically.',
        tags: ['Access Records'],

        parameters: [],
        requestBody: {
          $ref: '#/components/requestBodies/ClaimRequest'
        },
        responses: {
          201: {
            description: 'Success. Resource claimed.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/ClaimResponse'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to the resource collection to claim a sub-resource."
          },
          409: {
            description: 'AlreadyClaimed. The resource has already been claimed by another user or another user already has access to this resource. So admin access will not be given. The reason for this is to prevent preemptive stealing of admin access to these records.'
          }
        },
        security: [{ oauth2: [] }]
      }
    },
    '/v1/accounts': {
      get: {
        summary: 'Get all accounts user has access to',
        operationId: 'getAccounts',
        description: 'Returns a list of accounts that the user has access to.',
        tags: ['Accounts'],

        parameters: [
          {
            name: 'earliestCacheTime',
            in: 'query',
            description: 'Ensure the accounts list is not cached before this time.',
            required: false,
            schema: {
              type: 'string',
              format: 'date-time'
            }
          }
        ],
        responses: {
          200: {
            description: 'Success.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/AccountCollection'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          }
        },
        security: [{ oauth2: [] }]
      }
    },
    '/v1/accounts/{accountId}': {
      parameters: [
        {
          name: 'accountId',
          in: 'path',
          description: 'The unique identifier for the account',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],

      get: {
        summary: 'Get account information.',
        operationId: 'getAccount',
        description: 'Includes the original configuration information.',
        tags: ['Accounts'],

        responses: {
          200: {
            description: 'Success. The account',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/Account'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          404: {
            description: "Not found. The user doesn't have any permissions to this account or it does not exist."
          }
        },
        security: [{ oauth2: [] }]
      }
    },
    '/v1/identities': {
      post: {
        summary: 'Link a new account identity.',
        operationId: 'linkIdentity',
        description: 'An identity is a JWT subscriber *sub* and issuer *iss*. Only one account my be linked to a particular JWT combination. Allows calling the API with a federated token directly instead of using a client access key.',
        tags: ['Accounts'],

        parameters: [],
        requestBody: {
          $ref: '#/components/requestBodies/IdentityRequest'
        },
        responses: {
          201: {
            description: 'Success. New identity linked.'
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to update identities for the account."
          },
          404: {
            description: "Not found. The user doesn't have any permission to read account information or the account does not exist."
          }
        },
        security: [{ oauth2: [] }]
      },
      get: {
        summary: 'Get all linked identities for this account.',
        operationId: 'getAccountIdentities',
        description: 'Returns a list of identities linked for this account.',
        tags: ['Accounts'],

        responses: {
          200: {
            description: 'Success.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/IdentityCollection'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          404: {
            description: "Not found. The user doesn't have permission to list identities for this account."
          }
        },
        security: [{ oauth2: [] }]
      }
    },
    '/v1/clients': {
      post: {
        summary: 'Create a new client.',
        operationId: 'createClient',
        description: 'Creates a service client to interact with Authress or any other service on behalf of users. Each client has secret private keys used to authenticate with Authress. To use service clients created through other mechanisms, skip creating a client and create access records with the client identifier.',
        tags: ['Service Clients'],

        requestBody: {
          $ref: '#/components/requestBodies/Client'
        },
        responses: {
          201: {
            description: 'Success.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/Client'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          }
        },
        security: [{ oauth2: [] }]
      },
      get: {
        summary: 'Get clients collection.',
        operationId: 'getClients',
        description: 'Returns all clients that the user has access to in the account.',
        tags: ['Service Clients'],

        responses: {
          200: {
            description: 'Success.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/ClientCollection'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to the resource, but they have other permissions to the same resource."
          }
        },
        security: [{ oauth2: [] }]
      }
    },
    '/v1/clients/{clientId}': {
      parameters: [
        {
          name: 'clientId',
          in: 'path',
          description: 'The unique identifier for the client.',
          required: true,
          schema: {
            type: 'string',
            minLength: 1,
            maxLength: 64
          }
        }
      ],

      get: {
        summary: 'Get a client.',
        operationId: 'getClient',
        description: 'Returns all information related to client except for the private access keys.',
        tags: ['Service Clients'],

        responses: {
          200: {
            description: 'Success.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/Client'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          404: {
            description: "Not found. The user doesn't have permissions to the client or the client does not exist."
          }
        },
        security: [{ oauth2: [] }]
      },
      put: {
        summary: 'Update a client.',
        operationId: 'updateClient',
        description: 'Updates a client information.',
        tags: ['Service Clients'],

        requestBody: {
          $ref: '#/components/requestBodies/Client'
        },
        responses: {
          200: {
            description: 'Success. The client was updated',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/Client'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to update the client."
          },
          404: {
            description: "Not found. The user doesn't have permission to the account or the client does not exist."
          }
        },
        security: [{ oauth2: [] }]
      },
      delete: {
        summary: 'Delete a client.',
        operationId: 'deleteClient',
        description: 'This deletes the service client.',
        tags: ['Service Clients'],

        responses: {
          204: {
            description: 'Success. The client was deleted.'
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to delete the client."
          },
          404: {
            description: "Not found. The user doesn't have any permission to the client or the client does not exist"
          }
        },
        security: [{ oauth2: [] }]
      }
    },
    '/v1/clients/{clientId}/access-keys': {
      parameters: [
        {
          name: 'clientId',
          in: 'path',
          description: 'The unique identifier of the client.',
          required: true,
          schema: {
            type: 'string',
            minLength: 1,
            maxLength: 64
          }
        }
      ],

      post: {
        summary: 'Request a new access key.',
        operationId: 'requestAccessKey',
        description: 'Create a new access key for the client so that a service can authenticate with Authress as that client. Using the client will allow delegation of permission checking of users. (Limited to 5 Active keys per client)',
        tags: ['Service Clients'],

        responses: {
          201: {
            description: 'Success',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/ClientAccessKey'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to create access keys for the client."
          },
          404: {
            description: "Not found. The user doesn't have any permissions to client or the client does not exist."
          }
        },
        security: [{ oauth2: [] }]
      }
    },
    '/v1/clients/{clientId}/access-keys/{keyId}': {
      parameters: [
        {
          name: 'clientId',
          in: 'path',
          description: 'The unique identifier of the client.',
          required: true,
          schema: {
            type: 'string',
            minLength: 1,
            maxLength: 64
          }
        },
        {
          name: 'keyId',
          in: 'path',
          description: 'The id of the access key to remove from the client.',
          required: true,
          schema: {
            type: 'string',
            minLength: 1,
            maxLength: 64
          }
        }
      ],
      delete: {
        summary: 'Remove an access key for a client.',
        operationId: 'deleteAccessKey',
        description: 'Deletes an access key for a client prevent it from being used to authenticate with Authress.',
        tags: ['Service Clients'],

        responses: {
          204: {
            description: 'Success. The access key has been deleted.'
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to delete access keys from a client."
          },
          404: {
            description: "Not found. The user doesn't have any permissions to the client or the client does not exist."
          }
        },
        security: [{ oauth2: [] }]
      }
    },

    '/v1/connections': {
      get: {
        summary: 'Get all SSO connections.',
        operationId: 'getConnections',
        description: 'Returns a paginated connection list for the account. Only connections the user has access to are returned.',
        tags: ['Login Management'],
        responses: {
          200: {
            description: 'Success.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/ConnectionCollection'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to fetch account connections, but has other account permissions"
          },
          404: {
            description: "Not found. THe user doesn't have permissions to read any account information."
          }
        },
        security: [{ oauth2: [] }]
      },
      post: {
        summary: 'Create a new SSO connection.',
        operationId: 'createConnection',
        description: 'Specify identity connection details for Authress identity aggregation.',
        tags: ['Login Management'],

        parameters: [],
        requestBody: {
          $ref: '#/components/requestBodies/Connection'
        },
        responses: {
          201: {
            description: 'Success. Connection created',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/Connection'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to create connection."
          },
          404: {
            description: "Not found. The user doesn't have permission to update the account."
          }
        },
        security: [{ oauth2: [] }]
      }
    },
    '/v1/connections/{connectionId}': {
      parameters: [
        {
          name: 'connectionId',
          in: 'path',
          description: 'The connection identifier.',
          required: true,
          schema: {
            type: 'string',
            minLength: 1,
            maxLength: 64
          }
        }
      ],

      get: {
        summary: 'Get the SSO connection.',
        operationId: 'getConnection',
        description: 'Get the identity connection details for Authress identity aggregation.',
        tags: ['Login Management'],
        parameters: [],
        responses: {
          200: {
            description: 'Success.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/Connection'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to get connection."
          },
          404: {
            description: 'Not found. The connection does not exist.'
          }
        },
        security: [{ oauth2: [] }]
      },
      delete: {
        summary: 'Delete the SSO connection.',
        operationId: 'deleteConnection',
        description: 'Delete an identity connection details for Authress identity aggregation.',
        tags: ['Login Management'],

        parameters: [],
        responses: {
          204: {
            description: 'Success. Connection deleted'
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to delete connection."
          },
          404: {
            description: 'Not found. The connection does not exist.'
          }
        },
        security: [{ oauth2: [] }]
      },
      put: {
        summary: 'Update the SSO connection.',
        operationId: 'updateConnection',
        description: 'Specify identity connection details for Authress identity aggregation.',
        tags: ['Login Management'],

        parameters: [],
        requestBody: {
          $ref: '#/components/requestBodies/Connection'
        },
        responses: {
          200: {
            description: 'Success. Connection updated',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/Connection'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to update connection."
          },
          404: {
            description: 'Not found. The connection does not exist.'
          }
        },
        security: [{ oauth2: [] }]
      }
    },
    '/v1/connections/{connectionId}/users/{userId}/credentials': {
      parameters: [
        {
          name: 'connectionId',
          in: 'path',
          description: 'The connection identifier.',
          required: true,
          schema: {
            type: 'string',
            minLength: 1,
            maxLength: 64
          }
        },
        {
          name: 'userId',
          in: 'path',
          description: 'The connection user.',
          required: true,
          schema: {
            type: 'string',
            minLength: 1,
            maxLength: 64
          }
        }
      ],

      get: {
        summary: 'Get the user credentials for this connection.',
        operationId: 'getConnectionCredentials',
        description: 'Get the credentials for the user that were generated as part of the latest user login flow. Returns an access token that can be used with originating connection provider, based on the original scopes and approved permissions by that service.',
        tags: ['Login Management'],
        parameters: [],
        responses: {
          200: {
            description: 'Success.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/UserConnectionCredentials'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to get user connection credentials."
          },
          404: {
            description: 'Not found. The connection or user does not exist.'
          }
        },
        security: [{ oauth2: [] }]
      }
    },

    '/v1/tenants': {
      get: {
        summary: 'Get all tenants.',
        operationId: 'getTenants',
        description: 'Returns a paginated tenants list for the account. Only tenants the user has access to are returned.',
        tags: ['Login Management'],
        responses: {
          200: {
            description: 'Success.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/TenantCollection'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to fetch account tenants, but has other account permissions"
          },
          404: {
            description: "Not found. THe user doesn't have permissions to read any account information."
          }
        },
        security: [{ oauth2: [] }]
      },
      post: {
        summary: 'Create a new tenant.',
        operationId: 'createTenant',
        description: 'Specify tenant identity details for tenant tracking, separation, and user management. Tenant identifiers are persisted to access tokens created by Authress.',
        tags: ['Login Management'],

        parameters: [],
        requestBody: {
          $ref: '#/components/requestBodies/Tenant'
        },
        responses: {
          201: {
            description: 'Success. Tenant created',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/Tenant'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to create tenants."
          },
          404: {
            description: "Not found. The user doesn't have permission to update the account."
          }
        },
        security: [{ oauth2: [] }]
      }
    },
    '/v1/tenants/{tenantId}': {
      parameters: [
        {
          name: 'tenantId',
          in: 'path',
          description: 'The tenantId.',
          required: true,
          schema: {
            type: 'string',
            minLength: 1,
            maxLength: 64
          }
        }
      ],

      get: {
        summary: 'Get the tenant.',
        operationId: 'getTenant',
        description: 'Get the tenant details for an Authress tenant.',
        tags: ['Login Management'],
        parameters: [],
        responses: {
          200: {
            description: 'Success.',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/Tenant'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to get the tenant."
          },
          404: {
            description: 'Not found. The tenant does not exist.'
          }
        },
        security: [{ oauth2: [] }]
      },
      delete: {
        summary: 'Delete the tenant configuration.',
        operationId: 'deleteTenant',
        description: 'Delete a tenant. If a connection was created for the tenant then it is deleted as well.',
        tags: ['Login Management'],

        parameters: [],
        responses: {
          204: {
            description: 'Success. Tenant deleted'
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to delete tenant."
          },
          404: {
            description: 'Not found. The tenant does not exist.'
          }
        },
        security: [{ oauth2: [] }]
      },
      put: {
        summary: "Update a tenant's configuration.",
        operationId: 'updateTenant',
        description: 'Updates the tenants information and linked tenant if it exists.',
        tags: ['Login Management'],

        parameters: [],
        requestBody: {
          $ref: '#/components/requestBodies/Tenant'
        },
        responses: {
          200: {
            description: 'Success. Tenant updated',
            content: {
              'application/links+json': {
                schema: {
                  $ref: '#/components/schemas/Tenant'
                }
              }
            }
          },
          401: {
            description: 'Unauthorized. The request JWT found in the Authorization header is no longer valid.'
          },
          403: {
            description: "Forbidden. The user doesn't have permission to update tenant."
          },
          404: {
            description: 'Not found. The tenant does not exist.'
          }
        },
        security: [{ oauth2: [] }]
      }
    }
  },
  components: {
    requestBodies: {
      AccessRecord: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AccessRecord'
            }
          }
        }
      },
      AccessRequest: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AccessRequest'
            }
          }
        }
      },
      AccessRequestResponse: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AccessRequestResponse'
            }
          }
        }
      },
      Invite: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Invite'
            }
          }
        }
      },
      ClaimRequest: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ClaimRequest'
            }
          }
        }
      },
      Client: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Client'
            }
          }
        }
      },
      Connection: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Connection'
            }
          }
        }
      },
      Group: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Group'
            }
          }
        }
      },
      IdentityRequest: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/IdentityRequest'
            }
          }
        }
      },
      MetadataRequest: {
        required: true,
        description: '<strong>Important</strong>: Data request object which contains properties identifying the data as well as the metadata itself. While there is limited access, the data saved here should be considered encrypted with best practices (Encrypted in Transit and Encrypted at Rest only). However, while Authress will to store and access in the data in a safe way, usage of this endpoint affirms this data must be application data and not user data. If there are explicit regulations or compliances regarding the data and how it should be saved here, this endpoint must not be used. That includes, but is not limited to--user personal data, data that is protected by GDPR and similar data protection regulations.',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/MetadataObject'
            }
          }
        }
      },
      ResourcePermission: {
        required: true,
        description: 'The contents of the permission to set on the resource. Overwrites existing data.',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ResourcePermission'
            }
          }
        }
      },
      Role: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Role'
            }
          }
        }
      },
      Tenant: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Tenant'
            }
          }
        }
      },
      TokenRequest: {
        required: true,
        description: 'The contents of the permission to set on the token. Will be used instead of the users or clients full permissions. Cannot include permissions that the user or client do not have.',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/TokenRequest'
            }
          }
        }
      }
    },
    schemas: {
      Account: {
        type: 'object',
        additionalProperties: false,
        required: ['accountId', 'createdTime', 'company', 'features', 'links'],
        properties: {
          accountId: {
            type: 'string',
            minLength: 1,
            maxLength: 64
          },
          createdTime: {
            readOnly: true,
            type: 'string',
            format: 'date-time'
          },
          company: {
            type: 'object'
          },
          links: {
            readOnly: true,
            type: 'object',
            required: ['self'],
            properties: {
              self: {
                description: 'A self link pointing to this request url',
                $ref: '#/components/schemas/Link'
              }
            }
          }
        }
      },
      AccountCollection: {
        type: 'object',
        additionalProperties: false,
        required: ['accounts'],
        properties: {
          accounts: {
            $ref: '#/components/schemas/Account'
          }
        }
      },
      Connection: {
        type: 'object',
        additionalProperties: false,
        required: ['authenticationUrl'],
        properties: {
          type: {
            type: 'string',
            default: 'OAUTH2',
            enum: ['OAUTH2', 'SAML2']
          },
          connectionId: {
            type: 'string',
            minLength: 1,
            maxLength: 64
          },
          authenticationUrl: {
            type: 'string',
            minLength: 1,
            maxLength: 128
          },
          tokenUrl: {
            type: 'string',
            minLength: 1,
            maxLength: 128
          },
          issuerUrl: {
            type: 'string',
            minLength: 1,
            maxLength: 128
          },
          providerCertificate: {
            type: 'string',
            minLength: 1,
            maxLength: 4096
          },
          clientId: {
            type: 'string',
            minLength: 1,
            maxLength: 64
          },
          clientSecret: {
            type: 'string',
            minLength: 1,
            maxLength: 64
          },
          data: {
            type: 'object',
            additionalProperties: false,
            properties: {
              tenantId: {
                type: 'string',
                minLength: 1,
                maxLength: 128
              },
              name: {
                type: 'string',
                minLength: 1,
                maxLength: 64
              },
              supportedContentType: {
                type: 'string',
                default: 'application/json',
                enum: ['application/json', 'application/x-www-form-urlencoded']
              }
            }
          },
          createdTime: {
            readOnly: true,
            type: 'string',
            format: 'date-time'
          }
        }
      },
      ConnectionCollection: {
        description: 'A collection of connections.',
        type: 'object',
        additionalProperties: false,
        required: ['connections'],
        properties: {
          connections: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Connection'
            }
          }
        }
      },
      UserConnectionCredentials: {
        description: 'The user credentials for this connection which can be used to access the connection provider APIs.',
        type: 'object',
        additionalProperties: false,
        required: ['accessToken'],
        properties: {
          accessToken: {
            type: 'string',
            description: 'The access token.'
          }
        }
      },
      ResourcePermissionCollection: {
        description: 'A collection of resource permissions that have been defined.',
        type: 'object',
        additionalProperties: false,
        required: ['resources', 'links'],
        properties: {
          resources: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/ResourcePermission'
            }
          },
          links: {
            readOnly: true,
            type: 'object',
            required: ['self'],
            properties: {
              self: {
                description: 'A self link pointing to this request url',
                $ref: '#/components/schemas/Link'
              },
              next: {
                description: 'A link pointing to the next page in the collection if it exists. If there is no next page this property will not exist.',
                $ref: '#/components/schemas/Link'
              }
            }
          }
        }
      },
      ResourcePermission: {
        type: 'object',
        additionalProperties: false,
        required: ['permissions'],
        properties: {
          permissions: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['action', 'allow'],
              properties: {
                action: {
                  type: 'string',
                  enum: ['CLAIM', 'PUBLIC']
                },
                allow: {
                  type: 'boolean'
                }
              }
            }
          }
        }
      },
      ResourceUsersCollection: {
        description: 'A collection of users with explicit permission to a resource.',
        type: 'object',
        additionalProperties: false,
        required: ['users', 'links'],
        properties: {
          users: {
            description: 'A list of users',
            type: 'array',
            items: {
              $ref: '#/components/schemas/UserRoleCollection'
            }
          },
          links: {
            readOnly: true,
            type: 'object',
            required: ['self'],
            properties: {
              self: {
                description: 'A self link pointing to this request url',
                $ref: '#/components/schemas/Link'
              },
              next: {
                description: 'A link pointing to the next page in the collection if it exists. If there is no next page this property will not exist.',
                $ref: '#/components/schemas/Link'
              }
            }
          }
        }
      },
      Tenant: {
        type: 'object',
        additionalProperties: false,
        required: ['tenantId'],
        properties: {
          tenantId: {
            type: 'string',
            minLength: 1,
            maxLength: 128
          },
          tenantLookupIdentifier: {
            type: 'string',
            nullable: true,
            minLength: 1,
            maxLength: 64
          },
          data: {
            type: 'object',
            additionalProperties: false,
            properties: {
              name: {
                type: 'string',
                nullable: true,
                minLength: 1,
                maxLength: 64
              }
            }
          },
          connection: {
            type: 'object',
            additionalProperties: false,
            nullable: true,
            properties: {
              connectionId: {
                type: 'string',
                minLength: 1,
                maxLength: 64
              }
              // These aren't supported yet, and we aren't sure if they will ever be. Let's wait for a request to make this simpler before allowing input here. Current alternative is create
              // Connection + Tenant, or create Connection w/ tenantId, then update Tenant later if necessary
              // authenticationUrl: {
              //   writeOnly: true,
              //   type: 'string',
              //   minLength: 1,
              //   maxLength: 128
              // },
              // tokenUrl: {
              //   writeOnly: true,
              //   type: 'string',
              //   minLength: 1,
              //   maxLength: 128
              // },
              // clientId: {
              //   writeOnly: true,
              //   type: 'string',
              //   minLength: 1,
              //   maxLength: 64
              // },
              // clientSecret: {
              //   writeOnly: true,
              //   type: 'string',
              //   minLength: 1,
              //   maxLength: 64
              // },
              // supportedContentType: {
              //   writeOnly: true,
              //   type: 'string',
              //   default: 'application/json',
              //   enum: ['application/json', 'application/x-www-form-urlencoded']
              // }
            }
          },
          createdTime: {
            readOnly: true,
            type: 'string',
            format: 'date-time'
          }
        }
      },
      TenantCollection: {
        description: 'A collection of tenants.',
        type: 'object',
        additionalProperties: false,
        required: ['tenants'],
        properties: {
          connections: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Tenant'
            }
          }
        }
      },
      User: {
        description: 'A user object that identifies a user.',
        type: 'object',
        additionalProperties: false,
        required: ['userId'],
        properties: {
          userId: {
            type: 'string',
            minLength: 1,
            maxLength: 128
          }
        }
      },
      Group: {
        description: 'A group of users, which can be added to access records.',
        type: 'object',
        additionalProperties: false,
        required: ['users', 'admins', 'name', 'links'],
        properties: {
          groupId: {
            description: 'Unique identifier for the groupId, can be specified on record creation.',
            type: 'string',
            pattern: '^[a-zA-Z0-9-_]+$',
            minLength: 1,
            maxLength: 32
          },
          name: {
            description: 'A helpful name for this record',
            type: 'string',
            minLength: 1,
            maxLength: 128
          },
          lastUpdated: {
            description: 'The expected last time the group was updated',
            readOnly: true,
            type: 'string',
            format: 'date-time'
          },
          users: {
            description: 'The list of users in this group',
            type: 'array',
            items: {
              $ref: '#/components/schemas/User'
            }
          },
          admins: {
            description: 'The list of admins that can edit this record even if they do not have global record edit permissions.',
            type: 'array',
            items: {
              $ref: '#/components/schemas/User'
            }
          },
          links: {
            readOnly: true,
            type: 'object',
            required: ['self'],
            properties: {
              self: {
                description: 'A self link pointing to this request url',
                $ref: '#/components/schemas/Link'
              }
            }
          }
        }
      },
      LinkedGroup: {
        description: 'The referenced group',
        type: 'object',
        additionalProperties: false,
        required: ['groupId'],
        properties: {
          groupId: {
            description: 'The unique identifier for the group.',
            type: 'string',
            pattern: '^[a-zA-Z0-9-_]+$',
            minLength: 1,
            maxLength: 32
          }
        }
      },
      GroupCollection: {
        description: 'A collection of groups',
        type: 'object',
        additionalProperties: false,
        required: ['groups', 'links'],
        properties: {
          groups: {
            description: 'A list of groups',
            type: 'array',
            items: {
              $ref: '#/components/schemas/Group'
            }
          },
          links: {
            readOnly: true,
            type: 'object',
            required: ['self'],
            properties: {
              self: {
                description: 'A self link pointing to this request url',
                $ref: '#/components/schemas/Link'
              },
              next: {
                description: 'A link pointing to the next page in the collection if it exists. If there is no next page this property will not exist.',
                $ref: '#/components/schemas/Link'
              }
            }
          }
        }
      },
      AccessRecord: {
        description: 'The access record which links users to roles.',
        type: 'object',
        additionalProperties: false,
        required: ['users', 'account', 'name', 'statements', 'links'],
        properties: {
          recordId: {
            description: 'Unique identifier for the record, can be specified on record creation.',
            type: 'string',
            pattern: '^[a-zA-Z0-9-_:|~]+$',
            minLength: 1,
            maxLength: 100
          },
          name: {
            description: 'A helpful name for this record',
            type: 'string',
            minLength: 1,
            maxLength: 128
          },
          description: {
            description: 'More details about this record',
            type: 'string',
            nullable: true,
            minLength: 0,
            maxLength: 1024,
            example: ''
          },
          capacity: {
            description: 'Percentage capacity of record that is filled.',
            readOnly: true,
            type: 'number',
            format: 'float',
            minimum: 0,
            maximum: 1
          },
          lastUpdated: {
            description: 'The expected last time the record was updated',
            readOnly: true,
            type: 'string',
            format: 'date-time'
          },
          status: {
            description: 'Current status of the access record.',
            type: 'string',
            readOnly: true,
            enum: ['ACTIVE', 'DELETED']
          },
          account: {
            type: 'object',
            additionalProperties: false,
            required: ['accountId'],
            readOnly: true,
            properties: {
              accountId: {
                type: 'string'
              }
            }
          },
          users: {
            description: 'The list of users this record applies to',
            type: 'array',
            items: {
              $ref: '#/components/schemas/User'
            }
          },
          admins: {
            description: 'The list of admin that can edit this record even if they do not have global record edit permissions.',
            type: 'array',
            items: {
              $ref: '#/components/schemas/User'
            }
          },
          groups: {
            description: 'The list of groups this record applies to. Users in these groups will be receive access to the resources listed.',
            type: 'array',
            items: {
              $ref: '#/components/schemas/LinkedGroup'
            }
          },
          statements: {
            description: 'A list of statements which match roles to resources. Users in this record have all statements apply to them',
            type: 'array',
            minItems: 1,
            items: {
              $ref: '#/components/schemas/Statement'
            }
          },
          links: {
            readOnly: true,
            type: 'object',
            required: ['self'],
            properties: {
              self: {
                description: 'A self link pointing to this request url',
                $ref: '#/components/schemas/Link'
              }
            }
          }
        }
      },
      AccessRequest: {
        description: 'The access requested by a user.',
        type: 'object',
        additionalProperties: false,
        required: ['requestId', 'access', 'links'],
        properties: {
          requestId: {
            readOnly: true,
            description: 'Unique identifier for the request.',
            type: 'string',
            pattern: '^[a-zA-Z0-9-_:|~]+$',
            minLength: 1,
            maxLength: 100
          },
          lastUpdated: {
            description: 'The expected last time the record was updated',
            readOnly: true,
            type: 'string',
            format: 'date-time'
          },
          status: {
            description: 'Current status of the access record.',
            type: 'string',
            readOnly: true,
            enum: ['OPEN', 'APPROVED', 'DENIED', 'DELETED']
          },
          access: {
            description: 'Requested access details',
            $ref: '#/components/schemas/AccessTemplate'
          },
          links: {
            readOnly: true,
            type: 'object',
            required: ['self'],
            properties: {
              self: {
                description: 'A self link pointing to this request url',
                $ref: '#/components/schemas/Link'
              }
            }
          }
        }
      },
      AccessRequestResponse: {
        description: 'A dynamic body to support request PATCH operations',
        additionalProperties: false,
        required: ['status'],
        properties: {
          status: {
            description: 'New result, either approve or deny the request',
            type: 'string',
            enum: ['APPROVED', 'DENIED']
          }
        }
      },
      AccessTemplate: {
        description: 'A logical grouping of access related elements',
        type: 'object',
        additionalProperties: false,
        required: ['users', 'statements'],
        properties: {
          users: {
            description: 'The list of users the access applies to',
            type: 'array',
            minItems: 1,
            items: {
              $ref: '#/components/schemas/User'
            }
          },
          statements: {
            description: 'A list of statements which match roles to resources. Users here will have all statements apply to them',
            type: 'array',
            minItems: 1,
            items: {
              $ref: '#/components/schemas/Statement'
            }
          }
        }
      },
      Invite: {
        description: 'The user invite used to invite users to your application or to Authress as an admin.',
        type: 'object',
        required: ['inviteId', 'statements', 'links'],
        properties: {
          inviteId: {
            readOnly: true,
            description: 'The unique identifier for the invite.',
            type: 'string'
          },
          statements: {
            description: 'A list of statements which match roles to resources. The invited user will all statements apply to them',
            type: 'array',
            minItems: 1,
            items: {
              $ref: '#/components/schemas/Statement'
            }
          },
          links: {
            readOnly: true,
            type: 'object',
            required: ['self'],
            properties: {
              self: {
                description: 'A self link pointing to this request url',
                $ref: '#/components/schemas/Link'
              }
            }
          }
        }
      },
      Statement: {
        type: 'object',
        additionalProperties: false,
        required: ['roles', 'resources'],
        properties: {
          roles: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'string',
              pattern: '^[a-zA-Z0-9-._:@]+$',
              minLength: 1,
              maxLength: 64
            }
          },
          resources: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['resourceUri'],
              properties: {
                resourceUri: {
                  description: 'A resource path which can be top level, fully qualified, or end with a *. Parent resources imply permissions to sub-resources.',
                  type: 'string',
                  pattern: `^([*]|[/]?${resourceManager.primaryResourceUriPattern}([/]${resourceManager.resourceUriPattern}){0,9}([/][*]|[/]|)?|Authress:[*])$`,
                  minLength: 1,
                  maxLength: 512,
                  example: '/organizations/orgId:A/documents/docId:1'
                }
              }
            }
          }
        }
      },
      AccessRecordCollection: {
        description: 'A collection of access records',
        type: 'object',
        additionalProperties: false,
        required: ['records', 'links'],
        properties: {
          records: {
            description: 'A list of access records',
            type: 'array',
            items: {
              $ref: '#/components/schemas/AccessRecord'
            }
          },
          links: {
            readOnly: true,
            type: 'object',
            required: ['self'],
            properties: {
              self: {
                description: 'A self link pointing to this request url',
                $ref: '#/components/schemas/Link'
              },
              next: {
                description: 'A link pointing to the next page in the collection if it exists. If there is no next page this property will not exist.',
                $ref: '#/components/schemas/Link'
              }
            }
          }
        }
      },
      AccessRequestCollection: {
        description: 'A collection of access requests',
        type: 'object',
        additionalProperties: false,
        required: ['requests', 'links'],
        properties: {
          records: {
            description: 'A list of access requests',
            type: 'array',
            items: {
              $ref: '#/components/schemas/AccessRequest'
            }
          },
          links: {
            readOnly: true,
            type: 'object',
            required: ['self'],
            properties: {
              self: {
                description: 'A self link pointing to this request url',
                $ref: '#/components/schemas/Link'
              },
              next: {
                description: 'A link pointing to the next page in the collection if it exists. If there is no next page this property will not exist.',
                $ref: '#/components/schemas/Link'
              }
            }
          }
        }
      },
      RoleCollection: {
        description: 'A collection of roles',
        type: 'object',
        additionalProperties: false,
        required: ['roles', 'links'],
        properties: {
          roles: {
            description: 'A list of roles',
            type: 'array',
            items: {
              $ref: '#/components/schemas/Role'
            }
          },
          links: {
            readOnly: true,
            type: 'object',
            required: ['self'],
            properties: {
              self: {
                description: 'A self link pointing to this request url',
                $ref: '#/components/schemas/Link'
              },
              next: {
                description: 'A link pointing to the next page in the collection if it exists. If there is no next page this property will not exist.',
                $ref: '#/components/schemas/Link'
              }
            }
          }
        }
      },
      Role: {
        description: 'The role which contains a list of permissions.',
        type: 'object',
        additionalProperties: false,
        required: ['roleId', 'name', 'permissions'],
        properties: {
          roleId: {
            description: 'Unique identifier for the role, can be specified on creation, and used by records to map to permissions.',
            type: 'string',
            pattern: '^[a-zA-Z0-9-._:@]+$',
            minLength: 1,
            maxLength: 64
          },
          name: {
            description: 'A helpful name for this role',
            type: 'string',
            minLength: 1,
            maxLength: 128
          },
          description: {
            description: 'A description for when to the user as well as additional information.',
            type: 'string',
            nullable: true,
            minLength: 0,
            maxLength: 1024,
            example: ''
          },
          permissions: {
            description: 'A list of the permissions',
            type: 'array',
            items: {
              $ref: '#/components/schemas/PermissionObject'
            }
          }
        }
      },
      ClaimRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['collectionResource', 'resourceId'],
        properties: {
          collectionResource: {
            description: 'The parent resource to add a sub-resource to. The resource must have a resource configuration that add the permission CLAIM for this to work.',
            type: 'string',
            minLength: 1,
            maxLength: 128
          },
          resourceId: {
            description: 'The sub-resource the user is requesting Admin ownership over.',
            type: 'string',
            minLength: 1,
            maxLength: 128
          }
        }
      },
      ClaimResponse: {
        type: 'object'
      },
      ClientCollection: {
        description: 'The collection of a list of clients',
        type: 'object',
        additionalProperties: false,
        required: ['clients', 'links'],
        properties: {
          clients: {
            description: 'A list of clients',
            type: 'array',
            items: {
              $ref: '#/components/schemas/Client'
            }
          },
          links: {
            readOnly: true,
            type: 'object',
            required: ['self'],
            properties: {
              self: {
                description: 'A self link pointing to this request url',
                $ref: '#/components/schemas/Link'
              },
              next: {
                description: 'A link pointing to the next page in the collection if it exists. If there is no next page this property will not exist.',
                $ref: '#/components/schemas/Link'
              }
            }
          }
        }
      },
      Client: {
        description: 'A client configuration.',
        type: 'object',
        additionalProperties: false,
        required: ['clientId', 'createdTime'],
        properties: {
          clientId: {
            description: 'The unique id of the client.',
            type: 'string',
            readOnly: true
          },
          createdTime: {
            type: 'string',
            format: 'date-time',
            readOnly: true
          },
          name: {
            description: 'The name of the client',
            type: 'string',
            nullable: true,
            minLength: 1,
            maxLength: 64,
            example: ''
          },
          options: {
            description: 'A map of client specific options',
            type: 'object',
            additionalProperties: false,
            properties: {
              grantUserPermissionsAccess: {
                description: 'Grant the client access to verify authorization on behalf of any user.',
                type: 'boolean',
                nullable: true,
                example: false,
                default: false
              }
              // grantMetadataAccess: {
              //   description: 'Grant the client access to read and write user data on behalf of any user',
              //   type: 'boolean',
              //   nullable: true,
              //   example: false,
              //   default: false
              // }
            }
          }
        }
      },
      ClientAccessKey: {
        description: 'A client configuration.',
        type: 'object',
        additionalProperties: false,
        required: ['clientId'],
        properties: {
          keyId: {
            description: 'The unique id of the client.',
            type: 'string',
            readOnly: true
          },
          clientId: {
            description: 'The unique id of the client.',
            type: 'string',
            readOnly: true
          },
          generationDate: {
            type: 'string',
            format: 'date-time',
            readOnly: true
          },
          accessKey: {
            type: 'string',
            readOnly: true,
            description: 'An encoded access key which contains identifying information for client access token creation. For direct use with the Authress SDKs, not meant to be decoded. Must be saved on created, as it will never be returned from the API ever again. Authress only saved the corresponding public key to verify private access keys.'
          }
        }
      },
      IdentityRequest: {
        description: "Request to link an identity provider's audience and your app's audience with Authress.",
        type: 'object',
        additionalProperties: false,
        required: ['jwt'],
        properties: {
          jwt: {
            description: 'A valid JWT OIDC compliant token which will still pass authentication requests to the identity provider. Must contain a unique audience and issuer.',
            type: 'string'
          },
          preferredAudience: {
            description: 'If the `jwt` token contains more than one valid audience, then the single audience that should associated with Authress. If more than one audience is preferred, repeat this call with each one.',
            type: 'string',
            nullable: true,
            example: ''
          }
        }
      },
      IdentityCollection: {
        type: 'object',
        additionalProperties: false,
        required: ['identities'],
        properties: {
          identities: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Identity'
            }
          }
        }
      },
      Identity: {
        description: 'The identifying information which uniquely links a JWT OIDC token to an identity provider',
        type: 'object',
        additionalProperties: false,
        required: ['issuer', 'audience'],
        properties: {
          issuer: {
            description: 'The issuer of the JWT token. This can be any OIDC compliant provider.',
            type: 'string'
          },
          audience: {
            description: 'The audience of the JWT token. This can be either an audience for your entire app, or one particular audience for it. If there is more than one audience, multiple identities can be created.',
            type: 'string'
          }
        }
      },
      Link: {
        type: 'object',
        nullable: true,
        additionalProperties: false,
        description: 'A url linking object that complies to application/links+json RFC. Either is an IANA approved link relation or has a custom rel specified.',
        required: ['href'],
        properties: {
          href: {
            type: 'string',
            description: 'The absolute url pointing to the reference resource.'
          },
          rel: {
            type: 'string',
            description: 'Optional property indicating the type of link if it is not a default IANA approved global link relation.'
          }
        }
      },
      MetadataObject: {
        type: 'object',
        additionalProperties: false,
        description: 'Metadata and additional properties relevant.',
        required: ['accountId', 'userId', 'metadata'],
        properties: {
          account: {
            readOnly: true,
            type: 'object',
            additionalProperties: false,
            properties: {
              accountId: {
                type: 'string'
              }
            }
          },
          userId: {
            readOnly: true,
            type: 'string',
            minLength: 1,
            maxLength: 128
          },
          metadata: {
            description: 'A JSON object limited to 10KB. The owner identified by the sub will always have access to read and update this data. Service clients may have access if the related property on the client is set. Access is restricted to authorized users.',
            type: 'object',
            nullable: true,
            example: {}
          }
        }
      },
      PermissionObject: {
        description: 'The collective action and associate grants on a permission',
        type: 'object',
        additionalProperties: false,
        required: ['action', 'allow', 'grant', 'delegate'],
        properties: {
          action: {
            type: 'string',
            description: 'The action the permission grants, can be scoped using `:` and parent actions imply sub-resource permissions, action:* or action implies action:sub-action. This property is case-insensitive, it will always be cast to lowercase before comparing actions to user permissions.',
            pattern: '^([*]|((?!.*::[*])[a-zA-Z0-9-_]+:?)+(:[*])?)$',
            minLength: 1,
            maxLength: 64,
            example: 'documents:read'
          },
          allow: {
            type: 'boolean',
            description: 'Does this permission grant the user the ability to execute the action?'
          },
          grant: {
            type: 'boolean',
            description: 'Allows the user to give the permission to others without being able to execute the action.'
          },
          delegate: {
            type: 'boolean',
            description: 'Allows delegating or granting the permission to others without being able to execute tha action.'
          }
        }
      },
      PermissionResponse: {
        type: 'object',
        additionalProperties: false,
        description: 'A collect of permissions that the user has to a resource.',
        required: ['accountId', 'userId', 'permissions'],
        properties: {
          account: {
            type: 'object',
            additionalProperties: false,
            properties: {
              accountId: {
                type: 'string'
              }
            }
          },
          userId: {
            type: 'string',
            minLength: 1,
            maxLength: 128
          },
          permissions: {
            description: 'A list of the permissions',
            type: 'array',
            items: {
              $ref: '#/components/schemas/PermissionObject'
            }
          }
        }
      },
      UserRoleCollection: {
        type: 'object',
        additionalProperties: false,
        description: 'A collect of roles that the user has to a resource.',
        required: ['userId', 'roles'],
        properties: {
          userId: {
            type: 'string',
            minLength: 1,
            maxLength: 128
          },
          roles: {
            description: 'A list of the roles',
            type: 'array',
            items: {
              $ref: '#/components/schemas/UserRole'
            }
          }
        }
      },
      UserRole: {
        description: 'A role with associated role data.',
        type: 'object',
        additionalProperties: false,
        required: ['roleId'],
        properties: {
          roleId: {
            description: 'The identifier of the role.',
            $ref: '#/components/schemas/Role/properties/roleId'
          }
        }
      },
      UserResources: {
        type: 'object',
        additionalProperties: false,
        description: 'A collect of permissions that the user has to a resource.',
        required: ['accountId', 'userId', 'permissions', 'links'],
        properties: {
          account: {
            type: 'object',
            additionalProperties: false,
            properties: {
              accountId: {
                type: 'string'
              }
            }
          },
          userId: {
            type: 'string',
            minLength: 1,
            maxLength: 128
          },
          resources: {
            description: 'A list of the resources the user has some permission to.',
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                resourceUri: {
                  type: 'string',
                  description: 'The resourceUri that matches the requested resourceUri that the user has access to.',
                  pattern: `^([*]|[/]?${resourceManager.primaryResourceUriPattern}([/]${resourceManager.resourceUriPattern}){0,9}[/]?|Authress:[*])$`,
                  minLength: 1,
                  maxLength: 512,
                  example: '/organizations/orgId:A/documents/docId:1'
                }
              }
            }
          },
          links: {
            readOnly: true,
            type: 'object',
            required: ['self'],
            properties: {
              self: {
                description: 'A self link pointing to this request url',
                $ref: '#/components/schemas/Link'
              },
              next: {
                description: 'A link pointing to the next page in the collection if it exists. If there is no next page this property will not exist.',
                $ref: '#/components/schemas/Link'
              }
            }
          }
        }
      },
      UserToken: {
        type: 'object',
        additionalProperties: false,
        description: 'A JWT token with represents the user.',
        required: ['accountId', 'userId', 'token', 'tokenId'],
        properties: {
          account: {
            type: 'object',
            additionalProperties: false,
            properties: {
              accountId: {
                type: 'string'
              }
            }
          },
          userId: {
            type: 'string',
            minLength: 1,
            maxLength: 128
          },
          tokenId: {
            description: 'The unique identifier for the token',
            type: 'string'
          },
          token: {
            description: 'The access token',
            type: 'string'
          },
          links: {
            readOnly: true,
            type: 'object',
            required: ['self'],
            properties: {
              self: {
                description: 'A self link pointing to this token to be able to disable it or get its current configuration.',
                $ref: '#/components/schemas/Link'
              }
            }
          }
        }
      },
      TokenRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['statements', 'expires'],
        properties: {
          statements: {
            description: 'A list of statements which match roles to resources. The token will have all statements apply to it.',
            type: 'array',
            minItems: 1,
            items: {
              $ref: '#/components/schemas/Statement'
            }
          },
          expires: {
            description: 'The ISO8601 datetime when the token will expire. Default is 24 hours from now.',
            type: 'string',
            format: 'date-time'
          }
        }
      }
    },
    securitySchemes: {
      oauth2: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
};

module.exports = spec;
