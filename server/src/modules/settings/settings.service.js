import { and, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { rolePermissions, roles } from "../../db/schema/index.js";
import { invalidatePermissionCache } from "../../lib/permissionCache.js";

export async function getRBACMatrix() {
  const allRoles = await db.query.roles.findMany({
    orderBy: (roles, { asc }) => [asc(roles.name)],
    with: {
      permissions: true,
    },
  });

  return allRoles.map((role) => {
    const permissions = {};
    // Pre-populate resources with default "none"
    const resourcesList = [
      "fleet",
      "drivers",
      "trips",
      "fuel_expenses",
      "analytics",
    ];
    for (const res of resourcesList) {
      permissions[res] = "none";
    }

    for (const perm of role.permissions) {
      permissions[perm.resource] = perm.accessLevel;
    }

    return {
      canManageSettings: role.canManageSettings,
      name: role.name,
      permissions,
      roleId: role.id,
      slug: role.slug,
    };
  });
}

export async function updateRBACMatrix(matrixData) {
  return await db.transaction(async (tx) => {
    for (const r of matrixData) {
      // 1. Update roles table (canManageSettings)
      await tx
        .update(roles)
        .set({ canManageSettings: r.canManageSettings })
        .where(eq(roles.id, r.roleId));

      // 2. Update role_permissions
      for (const [resource, accessLevel] of Object.entries(r.permissions)) {
        // Find existing
        const [existing] = await tx
          .select()
          .from(rolePermissions)
          .where(
            and(
              eq(rolePermissions.roleId, r.roleId),
              eq(rolePermissions.resource, resource)
            )
          );

        if (existing) {
          await tx
            .update(rolePermissions)
            .set({ accessLevel })
            .where(eq(rolePermissions.id, existing.id));
        } else {
          await tx.insert(rolePermissions).values({
            accessLevel,
            resource,
            roleId: r.roleId,
          });
        }
      }
    }

    // Invalidate the cache
    invalidatePermissionCache();
  });
}

export async function getAllRoles() {
  return await db.select().from(roles);
}
