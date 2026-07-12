import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "./db/index.js"; // your drizzle instance
import { roles } from "./db/schema/index.js";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  databaseHooks: {
    user: {
      create: {
        before: async (userData) => {
          if (!userData.roleId) {
            // Find the dispatcher role as default
            const [dispRole] = await db
              .select()
              .from(roles)
              .where(eq(roles.slug, "dispatcher"));
            if (dispRole) {
              return {
                data: {
                  ...userData,
                  roleId: dispRole.id,
                },
              };
            }
          }
          return { data: userData };
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [process.env.CLIENT_URL],
  user: {
    additionalFields: {
      roleId: {
        required: false,
        type: "string",
      },
    },
  },
});
