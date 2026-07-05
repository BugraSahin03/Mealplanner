import { getSchemaVersion } from "@/src/db/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET(): Response {
  try {
    const schemaVersion = getSchemaVersion();

    return Response.json(
      {
        status: "ok",
        sqliteReady: true,
        schemaVersion,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        status: "error",
        sqliteReady: false,
        error: error instanceof Error ? error.message : "Unknown healthcheck error",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
