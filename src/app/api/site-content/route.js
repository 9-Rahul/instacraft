import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { revalidateTag } from "next/cache";
import db from "@/lib/db";

export const revalidate = 60;

async function getContent() {
  const rows = await db.query("SELECT * FROM site_content LIMIT 1");
  return rows[0] || null;
}

export async function GET() {
  try {
    let content = await getContent();
    if (!content) {
      const defaultValue = {
        about: JSON.stringify({ hero: {}, mission: {}, artisans: { list: [] } }),
        contact: JSON.stringify({
          overline: "Get in Touch",
          title: "Contact Ishta Crafts",
          description: "Our team is here to assist with any custom orders, product queries or artisan partnerships.",
          mapEmbed: "https://maps.google.com/?q=Sultan+Shahi+Charminar+Hyderabad",
        }),
        footer: JSON.stringify({ links: [], socialLinks: [] }),
      };
      
      const result = await db.query(
        "INSERT INTO site_content (about, contact, footer, created_at, updated_at) VALUES (?, ?, ?, NOW(3), NOW(3))",
        [defaultValue.about, defaultValue.contact, defaultValue.footer]
      );
      const rows = await db.query("SELECT * FROM site_content WHERE id = ?", [result.insertId]);
      content = rows[0];
    }
    const parseJSON = (str, fallback) => {
      try {
        return typeof str === 'string' ? JSON.parse(str) : (str || fallback);
      } catch {
        return fallback;
      }
    };

    const normalize = (raw) => ({
      ...raw,
      _id: raw.id.toString(),
      about: parseJSON(raw.about, { hero: {}, mission: {}, artisans: { list: [] } }),
      contact: parseJSON(raw.contact, { overline: "", title: "", description: "" }),
      footer: parseJSON(raw.footer, { brandDescription: "", copyright: "", socialLinks: [] })
    });

    return NextResponse.json({ 
      success: true, 
      siteContent: normalize(content) 
    });
  } catch (error) {
    console.error("GET /api/site-content error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch site content" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { error } = await requireAdmin(request);
    if (error) return error;

    const data = await request.json();
    let content = await getContent();

    // Remove contact sub-fields managed by SiteConfig
    const cleanedContent = { ...data.siteContent };
    if (cleanedContent.contact) {
      delete cleanedContent.contact.email;
      delete cleanedContent.contact.phone;
      delete cleanedContent.contact.address;
    }

    if (!content) {
      await db.query(
        "INSERT INTO site_content (about, contact, footer, created_at, updated_at) VALUES (?, ?, ?, NOW(3), NOW(3))",
        [
          JSON.stringify(cleanedContent.about || {}),
          JSON.stringify(cleanedContent.contact || {}),
          JSON.stringify(cleanedContent.footer || {})
        ]
      );
    } else {
      await db.query(
        "UPDATE site_content SET about = ?, contact = ?, footer = ?, updated_at = NOW(3) WHERE id = ?",
        [
          JSON.stringify(cleanedContent.about ?? content.about),
          JSON.stringify(cleanedContent.contact ?? content.contact),
          JSON.stringify(cleanedContent.footer ?? content.footer),
          content.id
        ]
      );
    }

    const updatedContent = await getContent();
    revalidateTag("site-content");
    return NextResponse.json({ success: true, siteContent: { ...updatedContent, _id: updatedContent.id.toString() } });
  } catch (error) {
    console.error("PUT /api/site-content error:", error);
    return NextResponse.json({ success: false, error: "Failed to update site content" }, { status: 500 });
  }
}
