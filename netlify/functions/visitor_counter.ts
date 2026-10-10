import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { siteStats } from "../../db/schema.js";
import { eq, sql } from "drizzle-orm";

export default async (req: Request) => {
  const statId = "main_page";

  if (req.method === "POST") {
    // Increment visitors
    const [result] = await db
      .insert(siteStats)
      .values({ id: statId, visitors: 1 })
      .onConflictDoUpdate({
        target: siteStats.id,
        set: { visitors: sql`${siteStats.visitors} + 1` },
      })
      .returning();
      
    return Response.json(result);
  }

  if (req.method === "GET") {
    // Just fetch current count
    const [result] = await db.select().from(siteStats).where(eq(siteStats.id, statId));
    if (!result) {
      return Response.json({ id: statId, visitors: 0 });
    }
    return Response.json(result);
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/visitor-counter",
};
