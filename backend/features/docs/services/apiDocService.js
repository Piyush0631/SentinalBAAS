import Project from "../../../models/Project.js";
import AppError from "../../../utils/apperror.js";

const AUTH_HEADER = {
  name: "x-api-key",
  required: true,
  type: "string",
  description: "Project API key",
};

function isValidFieldType(fieldType) {
  return ["String", "Number", "Boolean"].includes(fieldType);
}

// Support extended type handling
function buildExampleValue(fieldType) {
  switch (fieldType) {
    case "String":
      return "sample text";
    case "Number":
      return 0;
    case "Boolean":
      return false;
    default:
      return null;
  }
}

// Support required/optional + PATCH handling
function buildRequestSchema(recordSchema, method = "POST") {
  const properties = {};
  const required = [];

  Object.entries(recordSchema).forEach(([fieldName, fieldDef]) => {
    const fieldType = fieldDef.type || "String";

    // : Validate type
    if (!isValidFieldType(fieldType)) {
      console.warn(
        `Invalid type '${fieldType}' for field '${fieldName}', defaulting to String`,
      );
    }

    properties[fieldName] = {
      type: fieldType,
      description: fieldDef.description || `${fieldName} field`,
      example: buildExampleValue(fieldType),
    };

    // PATCH should not require all fields
    if (method === "POST" && fieldDef.required === true) {
      required.push(fieldName);
    }
    // PATCH: all fields optional, so required stays empty
  });

  return { type: "object", properties, required };
}

// Build response schema matching request
function buildResponseSchema(recordSchema) {
  const properties = {
    _id: {
      type: "String",
      format: "ObjectId",
      description: "MongoDB record ID (ObjectId)",
      example: "6634a2f1c3b2a10012e4d9f7",
    },
    createdAt: {
      type: "String",
      description: "ISO timestamp",
      example: "2025-01-01T00:00:00Z",
    },
  };

  const required = ["_id", "createdAt"];

  Object.entries(recordSchema).forEach(([fieldName, fieldDef]) => {
    const fieldType = fieldDef.type || "String";
    properties[fieldName] = {
      type: fieldType,
      description: fieldDef.description || `${fieldName} field`,
      example: buildExampleValue(fieldType),
    };

    if (fieldDef.required === true) {
      required.push(fieldName);
    }
  });

  return { type: "object", properties, required };
}

function buildExampleFromRecordSchema(recordSchema) {
  return Object.entries(recordSchema).reduce(
    (example, [fieldName, fieldDef]) => {
      example[fieldName] = buildExampleValue(fieldDef.type || "String");
      return example;
    },
    {},
  );
}

async function generateProjectDocs(projectId) {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new AppError("Project not found", 404, "PROJ_004");
  }

  if (!project.recordSchema || Object.keys(project.recordSchema).length === 0) {
    return {
      projectId: project._id,
      projectName: project.name,
      message: "No schema made yet",
      endpoints: [],
    };
  }

  const postRequestSchema = buildRequestSchema(project.recordSchema, "POST");
  const patchRequestSchema = buildRequestSchema(project.recordSchema, "PATCH");
  const responseSchema = buildResponseSchema(project.recordSchema);
  const requestExample = buildExampleFromRecordSchema(project.recordSchema);

  const baseEndpointData = {
    auth: { required: true, type: "apiKey", header: "x-api-key" },
    headers: [AUTH_HEADER],
  };

  const endpoints = [
    {
      operationId: "listRecords",
      tag: "records",
      summary: "List project records",
      description: "Returns paginated records for the given project",
      method: "GET",
      path: "/api/v1/projects/:projectId/records",
      ...baseEndpointData,

      pathParams: [
        {
          name: "projectId",
          required: true,
          type: "String",
          description: "Project ID",
        },
      ],

      queryParams: [
        { name: "page", required: false, type: "Number", default: 1 },
        { name: "limit", required: false, type: "Number", default: 10 },
        {
          name: "sortBy",
          required: false,
          type: "String",
          example: "createdAt",
        },
        {
          name: "order",
          required: false,
          type: "String",
          enum: ["asc", "desc"],
          default: "desc",
        },
      ],

      requestBody: null,

      responses: {
        200: {
          description: "Records fetched successfully",
          schema: {
            type: "object",
            properties: {
              success: { type: "Boolean" },
              data: {
                type: "object",
                properties: {
                  records: { type: "array", items: responseSchema },
                  pagination: {
                    type: "object",
                    properties: {
                      page: { type: "Number" },
                      limit: { type: "Number" },
                      total: { type: "Number" },
                      totalPages: { type: "Number" },
                    },
                  },
                },
              },
            },
          },
          example: {
            success: true,
            data: {
              records: [],
              pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
            },
          },
        },
        401: {
          description: "Unauthorized",
          example: {
            success: false,
            error: { code: "AUTH_002", message: "Unauthorized" },
          },
        },
      },
    },

    {
      operationId: "createRecord",
      tag: "records",
      summary: "Create record",
      description: "Creates a new record based on project record schema",
      method: "POST",
      path: "/api/v1/projects/:projectId/records",
      ...baseEndpointData,
      headers: [
        ...baseEndpointData.headers,
        {
          name: "Content-Type",
          required: true,
          type: "String",
          example: "application/json",
        },
      ],

      pathParams: [
        {
          name: "projectId",
          required: true,
          type: "String",
          description: "Project ID",
        },
      ],
      queryParams: [],

      requestBody: {
        required: true,
        contentType: "application/json",
        schema: postRequestSchema,
        example: requestExample,
      },

      responses: {
        201: {
          description: "Record created successfully",
          schema: {
            type: "object",
            properties: { success: { type: "Boolean" }, data: responseSchema },
          },
          example: {
            success: true,
            data: {
              _id: "6634a2f1c3b2a10012e4d9f7",
              createdAt: "2025-01-01T00:00:00Z",
              ...requestExample,
            },
          },
        },
        400: {
          description: "Validation failed",
          example: {
            success: false,
            error: { code: "RECORD_001", message: "Invalid payload" },
          },
        },
        401: {
          description: "Unauthorized",
          example: {
            success: false,
            error: { code: "AUTH_002", message: "Unauthorized" },
          },
        },
      },
    },

    {
      operationId: "getRecordById",
      tag: "records",
      summary: "Get record by ID",
      description: "Fetches a single record by its ID",
      method: "GET",
      path: "/api/v1/projects/:projectId/records/:recordId",
      ...baseEndpointData,

      pathParams: [
        {
          name: "projectId",
          required: true,
          type: "String",
          description: "Project ID",
        },
        {
          name: "recordId",
          required: true,
          type: "String",
          description: "Record ID",
        },
      ],
      queryParams: [],
      requestBody: null,

      responses: {
        200: {
          description: "Record fetched successfully",
          schema: {
            type: "object",
            properties: { success: { type: "Boolean" }, data: responseSchema },
          },
          example: {
            success: true,
            data: {
              _id: "6634a2f1c3b2a10012e4d9f7",
              createdAt: "2025-01-01T00:00:00Z",
              ...requestExample,
            },
          },
        },
        404: {
          description: "Record not found",
          example: {
            success: false,
            error: { code: "RECORD_004", message: "Record not found" },
          },
        },
        401: {
          description: "Unauthorized",
          example: {
            success: false,
            error: { code: "AUTH_002", message: "Unauthorized" },
          },
        },
      },
    },

    {
      operationId: "updateRecord",
      tag: "records",
      summary: "Partial update record",
      description: "Updates an existing record with partial data (PATCH)",
      method: "PATCH",
      path: "/api/v1/projects/:projectId/records/:recordId",
      ...baseEndpointData,
      headers: [
        ...baseEndpointData.headers,
        {
          name: "Content-Type",
          required: true,
          type: "String",
          example: "application/json",
        },
      ],

      pathParams: [
        {
          name: "projectId",
          required: true,
          type: "String",
          description: "Project ID",
        },
        {
          name: "recordId",
          required: true,
          type: "String",
          description: "Record ID",
        },
      ],
      queryParams: [],

      requestBody: {
        required: false,
        contentType: "application/json",
        schema: patchRequestSchema,
        example: requestExample,
      },

      responses: {
        200: {
          description: "Record updated successfully",
          schema: {
            type: "object",
            properties: { success: { type: "Boolean" }, data: responseSchema },
          },
          example: {
            success: true,
            data: {
              _id: "6634a2f1c3b2a10012e4d9f7",
              createdAt: "2025-01-01T00:00:00Z",
              ...requestExample,
            },
          },
        },
        400: {
          description: "Validation failed",
          example: {
            success: false,
            error: { code: "RECORD_001", message: "Invalid payload" },
          },
        },
        404: {
          description: "Record not found",
          example: {
            success: false,
            error: { code: "RECORD_004", message: "Record not found" },
          },
        },
        401: {
          description: "Unauthorized",
          example: {
            success: false,
            error: { code: "AUTH_002", message: "Unauthorized" },
          },
        },
      },
    },

    {
      operationId: "deleteRecord",
      tag: "records",
      summary: "Delete record",
      description: "Deletes a record by its ID",
      method: "DELETE",
      path: "/api/v1/projects/:projectId/records/:recordId",
      ...baseEndpointData,

      pathParams: [
        {
          name: "projectId",
          required: true,
          type: "String",
          description: "Project ID",
        },
        {
          name: "recordId",
          required: true,
          type: "String",
          description: "Record ID",
        },
      ],
      queryParams: [],
      requestBody: null,

      responses: {
        200: {
          description: "Record deleted successfully",
          example: { success: true, data: null },
        },
        404: {
          description: "Record not found",
          example: {
            success: false,
            error: { code: "RECORD_004", message: "Record not found" },
          },
        },
        401: {
          description: "Unauthorized",
          example: {
            success: false,
            error: { code: "AUTH_002", message: "Unauthorized" },
          },
        },
      },
    },
  ];

  return {
    projectId: project._id,
    projectName: project.name,
    basePath: "/api/v1/projects/:projectId/records",
    endpoints,
    generatedAt: new Date().toISOString(),
  };
}

export { generateProjectDocs };
