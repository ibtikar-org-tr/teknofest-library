export const buildUpdateQuery = (
  table: string,
  idField: string,
  idValue: string | number,
  payload: Record<string, unknown>
): { sql: string; params: unknown[] } => {
  const fields = Object.keys(payload).filter(
    (k) => payload[k] !== undefined
  );
  if (fields.length === 0) {
    return { sql: `SELECT 1`, params: [] };
  }
  const setClause = fields.map((f) => `${f} = ?`).join(", ");
  const params = fields.map((f) => payload[f]);
  params.push(idValue);
  const sql = `UPDATE ${table} SET ${setClause} WHERE ${idField} = ?`;
  return { sql, params };
};

export const toJsonText = (value: unknown): string | null => {
  if (value == null) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
};
