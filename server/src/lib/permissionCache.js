import { db } from "../db/index.js";
import { rolePermissions } from "../db/schema/index.js";

let cache = null;
let loadedAt = 0;
const TTL_MS = 60_000;

export async function getPermissionMatrix() {
  if (!cache || Date.now() - loadedAt > TTL_MS) {
    const rows = await db.select().from(rolePermissions);
    cache = rows.reduce((acc, row) => {
      (acc[row.roleId] ??= {})[row.resource] = row.accessLevel;
      return acc;
    }, {});
    loadedAt = Date.now();
  }
  return cache;
}

export function invalidatePermissionCache() {
  cache = null;
}