import { getPermissionMatrix } from "../lib/permissionCache.js";

const LEVEL_RANK = { none: 0, view: 1, full: 2 };

export function requirePermission(resource, minLevel = "view") {
  return async (req, res, next) => {
    if (!req.currentUser?.roleId) {
      return res.status(403).json({ error: "No role assigned" });
    }

    const matrix = await getPermissionMatrix();
    const level = matrix[req.currentUser.roleId]?.[resource] ?? "none";

    if (LEVEL_RANK[level] < LEVEL_RANK[minLevel]) {
      return res.status(403).json({ error: "Forbidden" });
    }

    req.accessLevel = level;
    next();
  };
}