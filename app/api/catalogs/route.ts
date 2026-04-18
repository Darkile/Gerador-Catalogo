import { NextResponse } from "next/server";
import { z } from "zod";
import { UnauthorizedApiError, requireApiUser } from "@/lib/api-auth";
import { createCatalog } from "@/lib/catalog-service";

export const runtime = "nodejs";

const createCatalogSchema = z.object({
  title: z.string().min(2).max(120),
  coverEnabled: z.boolean().default(true),
});

export async function POST(request: Request) {
  try {
    const payload = createCatalogSchema.parse(await request.json());
    const user = await requireApiUser();

    const catalog = await createCatalog({
      title: payload.title,
      coverEnabled: payload.coverEnabled,
      userId: user.id,
    });

    return NextResponse.json({ catalog }, { status: 201 });
  } catch (error) {
    console.error("POST /api/catalogs failed", error);
    if (error instanceof UnauthorizedApiError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Não foi possível criar catálogo.",
      },
      { status: 400 },
    );
  }
}
