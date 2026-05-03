import { z } from "zod";

export const buildRecordCreateSchema = (recordSchema) => {
  if (!recordSchema || Object.keys(recordSchema).length === 0) {
    return z.object({});
  }

  const shape = {};
  for (const [field, rules] of Object.entries(recordSchema)) {
    let fieldSchema;

    if (rules.type === "String") {
      fieldSchema = z.string();
    } else if (rules.type === "Number") {
      fieldSchema = z.coerce.number();
    } else if (rules.type === "Boolean") {
      fieldSchema = z.coerce.boolean();
    }

    if (rules.required) {
      shape[field] = fieldSchema;
    } else {
      shape[field] = fieldSchema.optional();
    }
  }

  return z.object(shape);
};

export const buildRecordUpdateSchema = (recordSchema) => {
  return buildRecordCreateSchema(recordSchema).partial();
};
