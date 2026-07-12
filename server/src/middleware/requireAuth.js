import { auth } from "../auth.js";
import { fromNodeHeaders } from "better-auth/node";
import { db } from "../db/index.js";
import { user, roles } from "../db/schema/index.js";
import { eq } from "drizzle-orm";

export async function requireAuth(req, res, next) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const [dbUser] = await db
    .select({
      id: user.id,
      roleId: user.roleId,
      roleSlug: roles.slug,
      canManageSettings: roles.canManageSettings,
    })
    .from(user)
    .leftJoin(roles, eq(user.roleId, roles.id))
    .where(eq(user.id, session.user.id));

  req.session = session;
  req.currentUser = dbUser;
  next();
}