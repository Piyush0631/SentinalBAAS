import Record from "../../../models/Record.js";

export function filterRecordsQuery(query, recordSchema, projectId) {
  const allowedFields = Object.keys(recordSchema || {});
  const filter = { project: projectId };

  const fieldTypes = {};
  for (const key of allowedFields) {
    fieldTypes[key] = recordSchema[key]?.type;
  }

  const flatQuery = {};
  for (const param in query) {
    if (typeof query[param] === "object" && !Array.isArray(query[param])) {
      for (const op in query[param]) {
        flatQuery[`${param}[${op}]`] = query[param][op];
      }
    } else {
      flatQuery[param] = query[param];
    }
  }

  for (const param in flatQuery) {
    const match = param.match(/^([\w]+)\[(gte|lte|gt|lt|ne|in)\]$/);
    if (match) {
      const key = match[1];
      const op = `$${match[2]}`;
      if (!allowedFields.includes(key)) continue;
      let value = flatQuery[param];
      const type = fieldTypes[key];
      if (op === "$in") {
        value = typeof value === "string" ? value.split(",") : value;
        if (type === "Number") {
          value = value
            .map((v) => {
              const num = Number(v);
              return isNaN(num) ? undefined : num;
            })
            .filter((v) => v !== undefined);
        }
        if (type === "Boolean") {
          value = value.map((v) => v === "true" || v === "1" || v === true);
        }
      } else {
        if (type === "Number") {
          const num = Number(value);
          if (isNaN(num)) continue;
          value = num;
        }
        if (type === "Boolean") {
          value = value === "true" || value === "1" || value === true;
        }
        if (type === "String") {
          value = { $regex: value, $options: "i" };
        }
      }
      if (!filter[`data.${key}`]) filter[`data.${key}`] = {};
      filter[`data.${key}`][op] = value;
      continue;
    }

    const key = param;
    if (!allowedFields.includes(key)) continue;
    const type = fieldTypes[key];
    let value = flatQuery[key];
    if (
      filter[`data.${key}`] &&
      typeof filter[`data.${key}`] === "object" &&
      Object.keys(filter[`data.${key}`]).length > 0
    ) {
      continue;
    }
    if (type === "Number") {
      const num = Number(value);
      if (isNaN(num)) continue;
      value = num;
    }
    if (type === "Boolean") {
      value = value === "true" || value === "1" || value === true;
    }
    if (type === "String") {
      value = { $regex: value, $options: "i" };
    }
    filter[`data.${key}`] = value;
  }
  return filter;
}

export function buildQueryOptions(query, allowedFields) {
  // Pagination with max limit
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100); // max 100
  const skip = (page - 1) * limit;

  let sort = { createdAt: -1 };
  if (query.sortBy && allowedFields.includes(query.sortBy)) {
    const order = query.order === "desc" ? -1 : 1;
    sort = { [`data.${query.sortBy}`]: order };
  }

  return {
    skip,
    limit,
    sort,
    page,
  };
}

export const getRecordsService = async (filter, options) => {
  const { skip, limit, sort } = options;
  const [records, total] = await Promise.all([
    Record.find(filter).sort(sort).skip(skip).limit(limit),
    Record.countDocuments(filter),
  ]);
  return { records, total };
};
