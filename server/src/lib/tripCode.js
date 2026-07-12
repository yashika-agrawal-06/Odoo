import { desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { trips } from "../db/schema/index.js";

export async function getNextTripCode() {
  const [latestTrip] = await db
    .select({ code: trips.code })
    .from(trips)
    .orderBy(desc(trips.createdAt))
    .limit(1);

  if (!latestTrip) {
    return "TR001";
  }

  const match = latestTrip.code.match(/^TR(\d+)$/);
  if (!match) {
    return "TR001";
  }

  const nextNum = Number.parseInt(match[1], 10) + 1;
  return `TR${String(nextNum).padStart(3, "0")}`;
}
