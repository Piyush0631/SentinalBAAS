export { filterRecordsQuery } from "./filterRecordsQuery.js";
import AppError from "../../../utils/apperror.js";
const typeMap = {
  String: "string",
  Number: "number",
  Boolean: "boolean",
};
export function validateRecordData(schema, data, options = {}) {
  const errors = [];
  const normalizedSchema =
    (schema || {}) instanceof Map
      ? Object.fromEntries(schema || {})
      : schema || {};
  for (const key of Object.keys(data)) {
    const rules = normalizedSchema[key];
    const value = data[key];
    if (!rules) {
      errors.push(`Field '${key}' is not allowed`);
      continue;
    }
    if (value === null) {
      errors.push(`${key} cannot be null`);
      continue;
    }
    if (rules.type) {
      const expectedType = typeMap[rules.type];
      if (typeof value !== expectedType) {
        errors.push(`${key} must be a ${expectedType}`);
      }
    }
  }
  if (!options.partial) {
    for (const key of Object.keys(normalizedSchema)) {
      const rules = normalizedSchema[key];
      if (rules.required && data[key] === undefined) {
        errors.push(`${key} is required`);
      }
    }
  }
  if (errors.length > 0) {
    throw new AppError("Validation failed", 400, "RECORD_002", errors);
  }
}
