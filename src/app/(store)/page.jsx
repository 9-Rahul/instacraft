import Image from "next/image";
import Link from "next/link";
import {
  getProducts,
  getFeaturedProducts,
  getCategories,
  getTestimonials,
  getSiteConfig,
  getHeroSlides,
} from "@/lib/api-server";
import HeroSlider from "@/components/layout/HeroSlider";
import DynamicHomePage from "@/components/layout/DynamicHomePage";

export default async function HomePage() {
  // Server-side: fetch from api.js (uses localStorage on client, static data on server)
  // These become the initial props / SSR seed for the dynamic client component
  const [allProducts, featured, categories, testimonials, siteConfig, heroSlides] =
    await Promise.all([
      getProducts(),
      getFeaturedProducts(),
      getCategories(),
      getTestimonials(3),
      getSiteConfig(),
      getHeroSlides(),
    ]);

  const physicalProducts = allProducts.filter((p) => p.type !== "service");

  return (
    <>
      {/* ── HERO SLIDER ── */}
      <section aria-label="Hero Highlights">
        <HeroSlider products={physicalProducts} initialSlides={heroSlides} />
      </section>

      {/* ── CATEGORIES ── */}
      <section
        className="section bg-surface-sunken"
        aria-labelledby="categories-title"
      >
        <div className="container">
          <div className="section-header">
            <span className="overline">Browse by Collection</span>
            <h2 id="categories-title" className="heading-lg">
              Shop by Category
            </h2>
            <p className="text-body">
              Four curated collections of India&rsquo;s finest handmade art
            </p>
          </div>
          <div className="grid grid-4">
            {categories
              .filter((c) => c.slug !== "custom-creations")
              .map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/shop/${cat.slug}`}
                  className="category-card"
                  aria-label={cat.label}
                >
                  <Image
                    src={cat.image}
                    alt={cat.label}
                    width={600}
                    height={800}
                    priority={true}
                    fetchPriority="high"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="category-card-image"
                  />
                  <div className="category-card-overlay">
                    <div
                      className="category-card-icon-wrap"
                      style={{ marginBottom: "var(--space-2)" }}
                    ></div>
                    <h3 className="category-card-title">{cat.label}</h3>
                    <span className="category-card-count">
                      {cat.count} items
                    </span>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* ── DYNAMIC CLIENT SECTIONS (reads localStorage → reflects admin changes) ── */}
      {/* Featured Products + Promo Banner + Custom Section + Testimonials */}
      <DynamicHomePage
        staticAllProducts={physicalProducts}
        staticFeatured={featured}
        staticTestimonials={testimonials}
        staticCategories={categories}
        staticConfig={siteConfig}
      />
    </>
  );
}
