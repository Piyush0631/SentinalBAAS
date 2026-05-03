import { z } from "zod";

const recordSchemaFieldSchema = z.object({
  type: z.enum(["String", "Number", "Boolean"]),
  required: z.boolean().optional(),
});

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name required")
    .max(100, "Project name max 100 characters"),
  description: z
    .string()
    .max(500, "Description max 500 characters")
    .optional()
    .nullable(),
  recordSchema: z
    .record(z.string(), recordSchemaFieldSchema)
    .refine(
      (schema) =>
        !["_id", "id", "project", "createdAt", "updatedAt", "__v"].some(
          (reserved) => reserved in schema,
        ),
      {
        message:
          "Cannot use reserved field names: _id, id, project, createdAt, updatedAt, __v",
      },
    )
    .optional()
    .nullable(),
});

export const updateProjectSchema = createProjectSchema.partial();
