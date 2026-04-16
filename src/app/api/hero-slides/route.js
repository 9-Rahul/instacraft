import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import db from "@/lib/db";
import { revalidateTag } from "next/cache";
import { normalizeHeroSlide } from "@/lib/normalize";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const showAll = url.searchParams.get("all") === "true";

    if (showAll) {
      const { error } = await requireAdmin(request);
      if (error) return error;
    }

    const query = showAll 
      ? "SELECT * FROM hero_slides ORDER BY sort_order ASC" 
      : "SELECT * FROM hero_slides WHERE active = 1 ORDER BY sort_order ASC";
    
    const rows = await db.query(query);
    const slides = rows.map(s => ({
      ...s,
      customId: s.custom_id,
      productSlug: s.product_slug,
      sortOrder: s.sort_order,
      createdAt: s.created_at,
      updatedAt: s.updated_at
    }));

    return NextResponse.json(slides.map(normalizeHeroSlide));
  } catch (error) {
    console.error("GET HeroSlides Error:", error);
    return NextResponse.json({ error: "Failed to fetch hero slides" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { error } = await requireAdmin(request);
    if (error) return error;

    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Expected an array of hero slides" }, { status: 400 });
    }

    // Delete all → insert new batch
    const insertedIds = await db.transaction(async (conn) => {
      await conn.execute("DELETE FROM hero_slides");
      const ids = [];
      for (let idx = 0; idx < body.length; idx++) {
        const h = body[idx];
        const [result] = await conn.execute(
          `INSERT INTO hero_slides (
            custom_id, title, subtitle, description, badge, video, poster, 
            product_slug, active, sort_order, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
          [
            h.id || h._id || `h-${Date.now()}-${idx}`,
            h.title || "",
            h.subtitle || null,
            h.description || null,
            h.badge || null,
            h.video || null,
            h.poster || null,
            h.productSlug || null,
            h.active !== false ? 1 : 0,
            parseInt(h.order) || idx
          ]
        );
        ids.push(result.insertId);
      }
      return ids;
    });

    const insertedRows = await db.query("SELECT * FROM hero_slides ORDER BY sort_order ASC");
    const inserted = insertedRows.map(s => ({
      ...s,
      customId: s.custom_id,
      productSlug: s.product_slug,
      sortOrder: s.sort_order,
      createdAt: s.created_at,
      updatedAt: s.updated_at
    }));

    revalidateTag("hero-slides");
    return NextResponse.json(inserted.map(normalizeHeroSlide), { status: 200 });
  } catch (error) {
    console.error("PUT HeroSlides Error:", error);
    return NextResponse.json({ error: "Failed to update hero slides" }, { status: 500 });
  }
}
