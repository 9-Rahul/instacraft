/**
 * api-server.js — Server-side only data layer.
 * Marks this module as 'server-only' to prevent it from being bundled for the browser.
 * Reads directly from MySQL via db.js (with unstable_cache).
 */
import 'server-only';
import db from "@/lib/db";
import { unstable_cache } from "next/cache";

// Helper: Convert Decimal/BigInt to plain JS numbers
const toNum = (val) => (val == null ? null : parseFloat(val.toString()));

// Helper: Normalize a Product row (duplicated from normalize.js for internal use or imported)
import { normalizeProduct as baseNormalizeProduct } from "@/lib/normalize";
import { categories as staticCategories } from "@/data/categories";

export async function getCategories() {
  return staticCategories;
}

export async function getCategoryBySlug(slug) {
  return staticCategories.find(c => c.slug === slug) || null;
}

function normalizeProduct(p) {
  return baseNormalizeProduct(p);
}

// ── PRODUCTS ──────────────────────────────────────────────────────────────────

export async function getProducts(forceFresh = false, page = 1, limit = 1000) {
  const getCachedProducts = unstable_cache(
    async () => {
      try {
        const skip = Math.floor(Number((page || 1) - 1) * (limit || 1000));
        const take = Math.floor(Number(limit || 1000));
        
        const rows = await db.query(
          "SELECT * FROM products ORDER BY created_at DESC LIMIT ? OFFSET ?",
          [take, skip]
        );
        
        if (rows.length === 0) return (page === 1 && limit === 1000) ? [] : { products: [], total: 0, page, limit };

        const productIds = rows.map(r => r.id);
        const images = await db.query(`SELECT * FROM product_images WHERE product_id IN (${productIds.join(",")})`);
        const tags = await db.query(`SELECT * FROM product_tags WHERE product_id IN (${productIds.join(",")})`);
        const [{ total }] = await db.query("SELECT COUNT(*) as total FROM products");

        const normalized = rows.map(p => normalizeProduct({
          ...p,
          images: images.filter(img => img.product_id === p.id),
          tags: tags.filter(t => t.product_id === p.id)
        }));

        if (page === 1 && limit === 1000) return normalized;
        return { products: normalized, total: parseInt(total), page, limit };
      } catch (error) {
        console.error("Direct DB fetch failed for products:", error);
        return (page === 1 && limit === 1000) ? [] : { products: [], total: 0, page, limit };
      }
    },
    [`products-server-list-p${page}-l${limit}`],
    { revalidate: forceFresh ? 1 : 3600, tags: ["products"] }
  );

  return getCachedProducts();
}

export async function getProductById(id) {
  const getCachedProduct = unstable_cache(
    async () => {
      try {
        const rows = await db.query("SELECT * FROM products WHERE id = ?", [id]);
        if (rows.length === 0) return null;
        
        const p = rows[0];
        const images = await db.query("SELECT * FROM product_images WHERE product_id = ?", [p.id]);
        const tags = await db.query("SELECT * FROM product_tags WHERE product_id = ?", [p.id]);

        return normalizeProduct({
          ...p,
          images,
          tags
        });
      } catch (error) {
        console.error(`Direct DB fetch failed for product ${id}:`, error);
        return null;
      }
    },
    [`product-server-${id}`],
    { revalidate: 3600, tags: [`product-${id}`] }
  );

  return getCachedProduct();
}

export async function getProductBySlug(slug) {
  const getCachedProduct = unstable_cache(
    async () => {
      try {
        const rows = await db.query("SELECT * FROM products WHERE slug = ?", [slug]);
        if (rows.length === 0) return null;
        
        const p = rows[0];
        const images = await db.query("SELECT * FROM product_images WHERE product_id = ?", [p.id]);
        const tags = await db.query("SELECT * FROM product_tags WHERE product_id = ?", [p.id]);

        return normalizeProduct({
          ...p,
          images,
          tags
        });
      } catch (error) {
        console.error(`Direct DB fetch failed for product ${slug}:`, error);
        return null;
      }
    },
    [`product-server-slug-${slug}`],
    { revalidate: 3600, tags: [`product-slug-${slug}`] }
  );

  return getCachedProduct();
}

export async function getRelatedProducts(slug, category, limit = 4) {
  try {
    const rows = await db.query(
      "SELECT * FROM products WHERE category = ? AND slug != ? LIMIT ?", 
      [category, slug, limit]
    );
    if (rows.length === 0) return [];

    const productIds = rows.map(r => r.id);
    const images = await db.query(`SELECT * FROM product_images WHERE product_id IN (${productIds.join(",")})`);
    const tags = await db.query(`SELECT * FROM product_tags WHERE product_id IN (${productIds.join(",")})`);

    return rows.map(p => normalizeProduct({
      ...p,
      images: images.filter(img => img.product_id === p.id),
      tags: tags.filter(t => t.product_id === p.id)
    }));
  } catch (error) {
    console.error("Related products fetch failed:", error);
    return [];
  }
}

export async function getProductsByCategory(category) {
  const getCachedCategoryProducts = unstable_cache(
    async () => {
      try {
        const rows = await db.query("SELECT * FROM products WHERE category = ? ORDER BY created_at DESC", [category]);
        if (rows.length === 0) return [];

        const productIds = rows.map(r => r.id);
        const images = await db.query(`SELECT * FROM product_images WHERE product_id IN (${productIds.join(",")})`);
        const tags = await db.query(`SELECT * FROM product_tags WHERE product_id IN (${productIds.join(",")})`);

        return rows.map(p => normalizeProduct({
          ...p,
          images: images.filter(img => img.product_id === p.id),
          tags: tags.filter(t => t.product_id === p.id)
        }));
      } catch (error) {
        console.error(`Direct DB fetch failed for category ${category}:`, error);
        return [];
      }
    },
    [`products-server-category-${category}`],
    { revalidate: 3600, tags: [`category-${category}`] }
  );

  return getCachedCategoryProducts();
}

export async function getFeaturedProducts() {
  const products = await getProducts();
  return products.filter(p => p.featured).slice(0, 8);
}

// ── OFFERS ────────────────────────────────────────────────────────────────────

export async function getOffers(idToken, forceFresh = false, includeInactive = false) {
  const getCachedOffers = unstable_cache(
    async () => {
      try {
        const sql = includeInactive ? "SELECT * FROM offers" : "SELECT * FROM offers WHERE active = 1";
        const offers = await db.query(sql);
        return offers.map((o) => ({
          ...o,
          _id: o.id.toString(),
          discount: toNum(o.discount),
          createdAt: o.created_at,
          updatedAt: o.updated_at,
        }));
      } catch (error) {
        console.error("Direct DB fetch failed for offers:", error);
        throw new Error("Failed to fetch offers");
      }
    },
    [`offers-server-${includeInactive}`],
    { revalidate: forceFresh ? 1 : 3600, tags: ["offers"] }
  );
  return getCachedOffers();
}

// ── COUPONS ───────────────────────────────────────────────────────────────────

export async function getCoupons(idToken, forceFresh = false) {
  const getCachedCoupons = unstable_cache(
    async () => {
      try {
        const coupons = await db.query("SELECT * FROM coupons WHERE active = 1");
        return coupons.map((c) => ({
          ...c,
          _id: c.id.toString(),
          discount: toNum(c.discount),
          minOrder: toNum(c.min_order),
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }));
      } catch (error) {
        console.error("Direct DB fetch failed for coupons:", error);
        throw new Error("Failed to fetch coupons");
      }
    },
    ["coupons-server-list"],
    { revalidate: forceFresh ? 1 : 3600, tags: ["coupons"] }
  );
  return getCachedCoupons();
}

// ── CUSTOMERS ──────────────────────────────────────────────────────────────────

export async function getCustomers(idToken, forceFresh = false, page = 1, limit = 1000) {
  const getCachedCustomers = unstable_cache(
    async () => {
      try {
        const skip = Math.floor(Number((page || 1) - 1) * (limit || 1000));
        const take = Math.floor(Number(limit || 1000));

        const rows = await db.query(
          "SELECT * FROM customers ORDER BY created_at DESC LIMIT ? OFFSET ?",
          [take, skip]
        );
        if (rows.length === 0) return (page === 1 && limit === 1000) ? [] : { customers: [], total: 0, page, limit };

        const customerUids = rows.map(r => r.firebase_uid);
        const addresses = await db.query(`SELECT * FROM customer_addresses WHERE customer_uid IN (${customerUids.map(u => `'${u}'`).join(",")})`);
        const [{ total }] = await db.query("SELECT COUNT(*) as total FROM customers");

        const normalized = rows.map(c => ({
          ...c,
          _id: c.id.toString(),
          totalSpent: toNum(c.total_spent),
          addresses: addresses.filter(a => a.customer_uid === c.firebase_uid).map(a => ({ ...a, _id: a.id.toString() }))
        }));

        if (page === 1 && limit === 1000) return normalized;
        return { customers: normalized, total: parseInt(total), page, limit };
      } catch (error) {
        console.error("Direct DB fetch failed for customers:", error);
        throw new Error("Failed to fetch customers");
      }
    },
    [`customers-server-list-p${page}-l${limit}`],
    { revalidate: forceFresh ? 1 : 3600, tags: ["customers"] }
  );
  return getCachedCustomers();
}

// ── ANALYTICS ─────────────────────────────────────────────────────────────────

export async function getDashboardAnalytics() {
  try {
    // 1. Core KPIs
    const [[{ totalOrders }], [{ totalCustomers }], [{ totalProducts }], [{ lowStockCount }]] = await Promise.all([
      db.query("SELECT COUNT(*) as totalOrders FROM orders"),
      db.query("SELECT COUNT(*) as totalCustomers FROM customers"),
      db.query("SELECT COUNT(*) as totalProducts FROM products"),
      db.query("SELECT COUNT(*) as lowStockCount FROM products WHERE stock < 10"),
    ]);

    // 2. Revenue & Sales
    const paidOrders = await db.query("SELECT * FROM orders WHERE payment_status = 'Paid'");
    const totalRevenue = paidOrders.reduce((sum, o) => sum + toNum(o.total_amount), 0);
    
    let totalItemsSold = 0;
    if (paidOrders.length > 0) {
      const orderIds = paidOrders.map(o => o.id);
      const items = await db.query(`SELECT * FROM order_items WHERE order_id IN (${orderIds.join(",")})`);
      totalItemsSold = items.reduce((sum, item) => sum + item.quantity, 0);
    }

    // 3. Growth (Last 30 days vs Previous 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const ordersCurrent = await db.query("SELECT * FROM orders WHERE created_at >= ?", [thirtyDaysAgo]);
    const ordersPrevious = await db.query("SELECT * FROM orders WHERE created_at >= ? AND created_at < ?", [sixtyDaysAgo, thirtyDaysAgo]);
    const [{ customersCurrent }] = await db.query("SELECT COUNT(*) as customersCurrent FROM customers WHERE created_at >= ?", [thirtyDaysAgo]);
    const [{ customersPrevious }] = await db.query("SELECT COUNT(*) as customersPrevious FROM customers WHERE created_at >= ? AND created_at < ?", [sixtyDaysAgo, thirtyDaysAgo]);

    const calculateRevenue = async (orderRows) => {
      if (orderRows.length === 0) return 0;
      return orderRows.reduce((sum, o) => sum + toNum(o.total_amount), 0);
    };

    const revCurrent = await calculateRevenue(ordersCurrent);
    const revPrevious = await calculateRevenue(ordersPrevious);

    const calcGrowth = (curr, prev) => (prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100);

    // 4. Recent Activities
    const rawRecentOrders = await db.query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 10");
    let recentOrders = [];
    if (rawRecentOrders.length > 0) {
      const recentOrderIds = rawRecentOrders.map(o => o.id);
      const allItems = await db.query(`SELECT * FROM order_items WHERE order_id IN (${recentOrderIds.join(",")})`);
    recentOrders = rawRecentOrders.map(o => {
      const orderItems = allItems.filter(i => (i.order_id || i.orderId) === o.id);
      return {
        id: (o.id || o._id || "").toString(),
        customer: o.shipping_name || o.shippingName || o.customerName || "Guest Customer",
        product: orderItems.length > 0 
          ? (orderItems.length > 1 ? `${orderItems[0].title} (+${orderItems.length - 1})` : orderItems[0].title)
          : "Standard Item",
        amount: toNum(o.total_amount || o.totalAmount || 0),
        status: o.logistics_status || o.logisticsStatus || o.status || "Placed",
        date: o.created_at || o.createdAt || o.date || new Date(),
        // Keep original fields for absolute fallback in UI
        ...o,
        _id: (o.id || o._id || "").toString(),
        items: orderItems.map(i => ({ ...i, id: i.item_product_id || i.productId || i.id }))
      };
    });

    console.log(`[DEBUG] Dashboard Analytics: Found ${recentOrders.length} recent orders. Sample ID: ${recentOrders[0]?.id}`);
    }

    return {
      totalRevenue: Math.round(totalRevenue),
      totalOrders,
      totalCustomers,
      totalProducts,
      totalItemsSold,
      lowStockCount,
      revenueChange: Math.round(calcGrowth(revCurrent, revPrevious)),
      ordersChange: Math.round(calcGrowth(ordersCurrent.length, ordersPrevious.length)),
      customersChange: Math.round(calcGrowth(customersCurrent, customersPrevious)),
      recentOrders,
    };
  } catch (error) {
    console.error("Analytics fetch failed:", error);
    throw new Error("Failed to load dashboard analytics");
  }
}

// ── TESTIMONIALS ──────────────────────────────────────────────────────────────

export async function getTestimonials(limit = 10) {
  try {
    const rows = await db.query("SELECT * FROM testimonials ORDER BY created_at DESC LIMIT ?", [limit]);
    return rows.map(t => ({ ...t, id: t.id.toString(), rating: parseInt(t.rating) }));
  } catch (error) {
    console.error("Testimonials fetch failed:", error);
    return [];
  }
}

// ── SITE CONFIG ───────────────────────────────────────────────────────────────

export async function getSiteConfig(forceFresh = false) {
  const getCachedConfig = unstable_cache(
    async () => {
      try {
        let configRows = await db.query("SELECT * FROM site_config LIMIT 1");
        let config = configRows[0];
        if (!config) {
          const [result] = await db.query(
            "INSERT INTO site_config (shipping_fee, free_shipping_threshold, created_at, updated_at) VALUES (?, ?, NOW(3), NOW(3))",
            [199.00, 1000.00]
          );
          configRows = await db.query("SELECT * FROM site_config WHERE id = ?", [result.insertId]);
          config = configRows[0];
        }
        return {
          ...config,
          _id: config.id.toString(),
          shippingFee: toNum(config.shipping_fee),
          freeShippingThreshold: toNum(config.free_shipping_threshold),
          updatedAt: config.updated_at,
        };
      } catch (error) {
        console.error("Direct DB fetch failed for site config:", error);
        return { shippingFee: 0, freeShippingThreshold: 0, address: '', phone: '', email: '' };
      }
    },
    ["site-config-server"],
    { revalidate: forceFresh ? 1 : 3600, tags: ["site-config"] }
  );
  return (await getCachedConfig()) || { shippingFee: 0, freeShippingThreshold: 0, address: '', phone: '', email: '' };
}

// ── HERO SLIDES ───────────────────────────────────────────────────────────────

export async function getHeroSlides(forceFresh = false, includeInactive = false) {
  const getCachedSlides = unstable_cache(
    async () => {
      try {
        const sql = includeInactive ? "SELECT * FROM hero_slides ORDER BY sort_order ASC" : "SELECT * FROM hero_slides WHERE active = 1 ORDER BY sort_order ASC";
        const slides = await db.query(sql);
        return slides.map((h) => ({
          ...h,
          _id: h.id.toString(),
          id: h.custom_id || h.id.toString(),
          order: h.sort_order,
          createdAt: h.created_at,
          updatedAt: h.updated_at,
        }));
      } catch (error) {
        console.error("Direct DB fetch failed for hero slides:", error);
        return [];
      }
    },
    [`hero-slides-server-${includeInactive}`],
    { revalidate: forceFresh ? 1 : 3600, tags: ["hero-slides"] }
  );
  return (await getCachedSlides()) || [];
}

// ── SITE CONTENT ──────────────────────────────────────────────────────────────

export async function getSiteContent(forceFresh = false) {
  const getCachedSiteContent = unstable_cache(
    async () => {
      try {
        let rows = await db.query("SELECT * FROM site_content LIMIT 1");
        let content = rows[0];
        if (!content) {
          const [result] = await db.query(
            "INSERT INTO site_content (about, contact, created_at, updated_at) VALUES (?, ?, NOW(3), NOW(3))",
            [JSON.stringify({ text: 'Default about text' }), JSON.stringify({ email: 'contact@ishtacrafts.in' })]
          );
          rows = await db.query("SELECT * FROM site_content WHERE id = ?", [result.insertId]);
          content = rows[0];
        }
        
        const safeParse = (val, def) => {
          if (!val) return def;
          if (typeof val === 'string') {
            try { return JSON.parse(val); } catch(e) { return def; }
          }
          return val;
        };

        return {
          ...content,
          _id: content.id.toString(),
          updatedAt: content.updated_at,
          about: safeParse(content.about, {}),
          contact: safeParse(content.contact, {}),
          footer: safeParse(content.footer, { links: [], socialLinks: [], logo: '' }),
        };
      } catch (error) {
        console.error("Direct DB fetch failed for site content:", error);
        return { about: {}, contact: {}, footer: { links: [], socialLinks: [], logo: '' } };
      }
    },
    ["site-content-server"],
    { revalidate: forceFresh ? 1 : 3600, tags: ["site-content"] }
  );
  return (await getCachedSiteContent()) || { about: {}, contact: {}, footer: { links: [], socialLinks: [], logo: '' } };
}
