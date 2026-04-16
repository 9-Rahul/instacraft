"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  CUSTOM_SERVICES, 
  BUSINESS_INFO 
} from "@/lib/constants";
import { useSiteConfig } from "@/store/SiteConfigContext";
import { useCart } from "@/store/CartContext";
import { SparkleIcon } from "@/components/common/Icons";

// ── GALLERY IMAGES (using existing project images) ────────────────────────────
const GALLERY_IMAGES = [
  { src: "/images/pexels-photo-31452296.webp", alt: "Custom photo frame in brass finish" },
  { src: "/images/pexels-photo-33619692.webp", alt: "Handcrafted decorative frame" },
  { src: "/images/pexels-photo-31477845.webp", alt: "Metal art wall piece" },
  { src: "/images/pexels-photo-12896785.webp", alt: "Bespoke frame close-up" },
  { src: "/images/pexels-photo-30921929.webp", alt: "Custom creation craftsmanship" },
  { src: "/images/pexels-photo-21383559.webp", alt: "Handmade metal frame detail" },
  { src: "/images/pexels-photo-33810565.webp", alt: "Artisan photo frame work" },
  { src: "/images/pexels-photo-14913872.webp", alt: "Finished custom order" },
  { src: "/images/pexels-photo-20895320.webp", alt: "Premium handicraft creation" },
];

// ── LIGHTBOX COMPONENT ────────────────────────────────────────────────────────
function Lightbox({ image, onClose }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.92)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "var(--space-6)",
        cursor: "zoom-out",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: "absolute", top: 20, right: 24,
          background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%",
          width: 44, height: 44, cursor: "pointer", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 300,
        }}
      >✕</button>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "90vw", maxHeight: "88vh", borderRadius: 12, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}
      >
        <Image
          src={image.src}
          alt={image.alt}
          width={1200}
          height={800}
          style={{ maxWidth: "90vw", maxHeight: "88vh", objectFit: "contain", display: "block" }}
        />
      </div>
    </div>
  );
}

// ── DETAILED FORM MODAL COMPONENT ────────────────────────────────────────────────
function CustomCreationFormModal({ onClose, service = {} }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    vision: "",
    picCount: 1,
    type: "Single Photo",
    images: [],
    size: "Medium",
    frameColor: "#5d2323",
  });
  const [previews, setPreviews] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    if (form.type === "Single Photo" && form.images.length + files.length > 1) {
      setError("Single Photo type only allows 1 image.");
      return;
    }

    if (form.images.length + files.length > 5) {
      setError("Maximum 5 images allowed.");
      return;
    }

    for (let file of files) {
      if (file.size > MAX_SIZE) {
        setError(`File ${file.name} is too large. Max 5MB.`);
        return;
      }
    }

    setError("");
    const newImages = [...form.images, ...files];
    setForm(f => ({ ...f, images: newImages }));

    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(p => [...p, ...newPreviews]);
  };

  const removeImage = (index) => {
    const newImages = [...form.images];
    newImages.splice(index, 1);
    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setForm(f => ({ ...f, images: newImages }));
    setPreviews(newPreviews);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.vision) {
      setError("All fields (Name, Email, and Instructions) are required.");
      return;
    }

    const count = form.type === "Single Photo" ? 1 : (parseInt(form.picCount) || 0);
    if (!count || count < 1) {
      setError("Please specify a valid number of pictures (1-5).");
      return;
    }
    if (form.images.length !== count) {
      setError(`Please upload exactly ${count} image${count > 1 ? "s" : ""} as specified in "Number of Pictures".`);
      return;
    }

    // Creating a mock product object to add to cart
    const customProduct = {
      id: `custom-${Date.now()}`,
      slug: `${service?.id || "creation"}`,
      title: service?.title || "Custom Creation",
      price: 1, 
      salePrice: 0,
      images: previews.length > 0 ? [previews[0]] : ["/images/pexels-photo-31452296.webp"],
      category: "custom-creations",
      type: "service",
      customization: {
        picCount: count,
        type: form.type,
        size: form.size,
        frameColor: form.frameColor,
        imageCount: form.images.length,
        imageNames: form.images.map(f => f.name),
        description: form.vision,
        contact: {
          name: form.name,
          email: form.email,
          phone: form.phone
        }
      }
    };

    addItem(customProduct, 1);
    setSubmitted(true);
    setTimeout(() => {
      router.push("/cart");
      onClose();
    }, 1500);
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Customize ${service?.title}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" style={{ maxWidth: 640, width: "95%" }}>
        <div className="modal-header">
          <div>
            <h2 className="heading-sm">Customize {service?.title}</h2>
            <p className="text-muted" style={{ fontSize: "var(--fs-14)", marginTop: 4 }}>
              Tell us your vision — we&apos;ll craft it.
            </p>
          </div>
          <button className="navbar-icon-btn" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          {submitted ? (
            <div style={{ textAlign: "center", padding: "var(--space-8) 0" }}>
              <span style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <SparkleIcon size={56} style={{ color: "var(--secondary)" }} />
              </span>
              <h3 className="heading-sm mb-3">Requirement Saved!</h3>
              <p className="text-body">Added to cart. Redirecting to checkout...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              {error && (
                <div style={{ padding: 'var(--space-3)', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--red-500)', borderRadius: 'var(--border-radius)', fontSize: 'var(--fs-13)', fontWeight: 600 }}>
                  {error}
                </div>
              )}
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-input" required value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" required value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div className="form-group">
                  <label className="form-label">Number of Pictures (1-5) *</label>
                  <input 
                    className="form-input" 
                    type="number" 
                    min="1" 
                    max="5" 
                    required 
                    disabled={form.type === "Single Photo"}
                    value={form.type === "Single Photo" ? 1 : (form.picCount ?? "")} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm(f => ({ ...f, picCount: val === "" ? "" : parseInt(val) }));
                    }} 
                  />
                  {form.type === "Single Photo" && <span style={{fontSize: 10, color: 'var(--text-muted)'}}>Locked to 1 for Single Photo</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Type *</label>
                  <select 
                    className="form-input" 
                    value={form.type} 
                    onChange={(e) => {
                      const newType = e.target.value;
                      setForm(f => ({ 
                        ...f, 
                        type: newType, 
                        picCount: newType === "Single Photo" ? 1 : f.picCount,
                        images: newType === "Single Photo" ? f.images.slice(0, 1) : f.images
                      }));
                      if (newType === "Single Photo" && previews.length > 1) {
                         setPreviews(p => p.slice(0, 1));
                      }
                    }}
                  >
                    <option>Single Photo</option>
                    <option>Collage</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div className="form-group">
                  <label className="form-label">Frame Size *</label>
                  <select className="form-input" value={form.size} onChange={(e) => setForm(f => ({ ...f, size: e.target.value }))}>
                    <option>Small</option>
                    <option>Medium</option>
                    <option>Large</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Frame Color *</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="color" className="form-input" style={{ padding: 4, height: 42, width: 60 }} value={form.frameColor} onChange={(e) => setForm(f => ({ ...f, frameColor: e.target.value }))} />
                    <span style={{ fontSize: 'var(--fs-13)', fontFamily: 'monospace' }}>{form.frameColor}</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Upload Images (Max 5, 5MB each) *</label>
                <input
                  type="file"
                  multiple={form.type !== "Single Photo"}
                  accept="image/*"
                  onChange={handleImageChange}
                  className="form-input"
                  style={{ padding: '8px' }}
                />
                {previews.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, overflowX: 'auto', paddingBottom: 8 }}>
                    {previews.map((src, i) => (
                      <div key={src} style={{ position: 'relative', flexShrink: 0 }}>
                        <img src={src} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border-light)' }} alt="preview" />
                        <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: '50%', background: 'var(--red-500)', color: 'var(--surface-white)', border: 'none', fontSize: 10, cursor: 'pointer' }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Additional Instructions *</label>
                <textarea className="form-input form-textarea" rows={3} required placeholder="Tell us more about your ideas..." value={form.vision} onChange={(e) => setForm(f => ({ ...f, vision: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                Add Customized Product to Cart →
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function CustomCreationsClient() {
  const [showModal, setShowModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const { config } = useSiteConfig();

  const whatsappNumber = config?.phone || BUSINESS_INFO.whatsapp;
  const whatsappQuoteUrl = `https://wa.me/${whatsappNumber}?text=Hi%2C%20I%20am%20interested%20in%20a%20custom%20photo%20frame%20from%20Ishta%20Crafts.`;
  const contactEmail = config?.email || BUSINESS_INFO.email;
  const contactAddress = config?.address || BUSINESS_INFO.address;

  const service = CUSTOM_SERVICES[0];

  return (
    <>
      {showModal && <CustomCreationFormModal onClose={() => setShowModal(false)} service={service} />}
      {lightboxImage && <Lightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />}

      {/* ── HERO ── */}
      <section
        aria-labelledby="custom-hero-title"
        style={{
          background: "linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 60%, #6b2d2d 100%)",
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div className="custom-hero-orb custom-hero-orb-1" />
          <div className="custom-hero-orb custom-hero-orb-2" />
          <div className="custom-hero-orb custom-hero-orb-3" />
        </div>

        <div className="container" style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <span className="overline" style={{ color: "var(--secondary)", fontSize: "var(--fs-13)" }}>
            Bespoke Metal Photo Frames · Hyderabad
          </span>
          <h1
            id="custom-hero-title"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              fontWeight: 900,
              color: "#fff",
              margin: "var(--space-4) 0 var(--space-6)",
              lineHeight: 1.1,
            }}
          >
            Divine Vision.
            <br />
            <span style={{ color: "var(--secondary)" }}>Our Craft.</span>
          </h1>
          <p style={{ fontSize: "var(--fs-18)", color: "rgba(255,255,255,0.85)", maxWidth: 600, margin: "0 auto var(--space-10)", lineHeight: "var(--lh-loose)" }}>
            Commission divine idols of your choice — any deity, any size, any finish. Hand-cast by artisans in Hyderabad with brass or bronze using centuries-old techniques.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)", justifyContent: "center" }}>
            <button id="custom-share-idea-btn" onClick={() => setShowModal(true)}
              className="btn btn-secondary btn-lg"
              style={{ fontWeight: 700, fontSize: "var(--fs-16)", padding: "14px 28px" }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <SparkleIcon size={18} /> Start Customizing
              </span>
            </button>
            <a id="custom-whatsapp-quote-btn" href={whatsappQuoteUrl} target="_blank" rel="noopener noreferrer"
              className="btn btn-lg"
              style={{ background: "#25D366", color: "#fff", border: "none", fontWeight: 700, fontSize: "var(--fs-16)", padding: "14px 28px", display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Get Quote on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── SINGLE SERVICE SPOTLIGHT ── */}
      <section className="section" aria-labelledby="service-title" style={{ background: "var(--surface)" }}>
        <div className="container">
          <div className="section-header">
            <span className="overline">What We Create</span>
            <h2 id="service-title" className="heading-lg">Custom God Idols</h2>
            <p className="text-body">A collaboration between your divine inspiration and centuries of Indian metalwork mastery.</p>
          </div>

          {/* Centered single-card spotlight */}
          <div style={{
            maxWidth: 680,
            margin: "0 auto",
            background: "var(--surface-sunken)",
            borderRadius: 20,
            overflow: "hidden",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
          }}>
            {/* Image side */}
            <div style={{ position: "relative", minHeight: 280 }}>
              <Image
                src="/images/pexels-photo-31452296.webp"
                alt="Custom photo frame craftsmanship"
                fill
                priority
                style={{ objectFit: "cover" }}
              />
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(135deg, rgba(139,0,0,0.3) 0%, transparent 60%)",
              }} />
            </div>

            {/* Content side */}
            <div style={{ padding: "var(--space-8) var(--space-6)", display: "flex", flexDirection: "column", justifyContent: "center", gap: "var(--space-4)" }}>
              {/* Photo icon */}
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 56, height: 56, borderRadius: 14,
                background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                marginBottom: "var(--space-2)",
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </span>
              <h3 className="heading-sm" style={{ color: "var(--text-dark)" }}>{service.title}</h3>
              <p className="text-body-sm" style={{ lineHeight: "var(--lh-loose)", color: "var(--text-muted)" }}>{service.description}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["Brass", "Bronze", "Aluminium"].map((m) => (
                  <span key={m} className="badge badge-secondary">{m}</span>
                ))}
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-primary"
                id="custom-service-enquire-btn"
                style={{ marginTop: "var(--space-2)" }}
              >
                Enquire Now →
              </button>
            </div>
          </div>

          {/* Feature pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", justifyContent: "center", marginTop: "var(--space-10)" }}>
            {[
              "✦ Any Deity Available",
              "✦ Any Size Available",
              "✦ Traditional Finishes",
              "✦ Sacred Packaging",
              "✦ Pan-India Delivery",
            ].map((pill) => (
              <span key={pill} style={{
                padding: "8px 18px",
                background: "var(--surface-sunken)",
                border: "1px solid var(--border)",
                borderRadius: 999,
                fontSize: "var(--fs-14)",
                fontWeight: 500,
                color: "var(--text-dark)",
              }}>
                {pill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── PHOTO GALLERY ── */}
      <section className="section" aria-labelledby="gallery-title" style={{ background: "var(--surface-sunken)" }}>
        <div className="container">
          <div className="section-header">
            <span className="overline">Our Craftsmanship</span>
            <h2 id="gallery-title" className="heading-lg">Previous Work Gallery</h2>
            <p className="text-body">A glimpse into the custom creations we&apos;ve crafted for customers across India.</p>
          </div>

          {/* Masonry-style gallery grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gridAutoRows: "220px",
            gap: "var(--space-3)",
          }}>
            {GALLERY_IMAGES.map((img, i) => (
              <button
                key={img.src}
                onClick={() => setLightboxImage(img)}
                aria-label={`View: ${img.alt}`}
                id={`gallery-item-${i}`}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 12,
                  cursor: "zoom-in",
                  border: "none",
                  padding: 0,
                  outline: "none",
                  /* Make some cells span 2 rows for variety */
                  gridRow: (i === 0 || i === 4 || i === 7) ? "span 2" : "span 1",
                  height: "100%",
                  background: "var(--surface)",
                }}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  priority={i < 4}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  style={{ objectFit: "cover", transition: "transform 0.4s ease" }}
                  className="gallery-thumb"
                />
                {/* Hover overlay */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)",
                    opacity: 0,
                    transition: "opacity 0.3s ease",
                  }}
                  className="gallery-overlay"
                />
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute", bottom: 12, right: 12,
                    background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)",
                    color: "#fff", fontSize: "var(--fs-13)", fontWeight: 600,
                    padding: "5px 12px", borderRadius: 999,
                    opacity: 0, transition: "opacity 0.3s ease",
                  }}
                  className="gallery-zoom-label"
                >
                  View ↗
                </span>
              </button>
            ))}
          </div>

          {/* Gallery hover style injection */}
          <style>{`
            .gallery-thumb { transform: scale(1); }
            button:hover .gallery-thumb { transform: scale(1.07); }
            button:hover .gallery-overlay { opacity: 1 !important; }
            button:hover .gallery-zoom-label { opacity: 1 !important; }
          `}</style>

          <div style={{ textAlign: "center", marginTop: "var(--space-10)" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-15)", marginBottom: "var(--space-4)" }}>
              Like what you see? Let&apos;s create something special for you.
            </p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary btn-lg" id="gallery-cta-btn">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <SparkleIcon size={18} /> Start Your Custom Frame
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section className="section" aria-labelledby="process-title" style={{ background: "var(--surface)" }}>
        <div className="container">
          <div className="section-header">
            <span className="overline">How It Works</span>
            <h2 id="process-title" className="heading-lg">From Photo to Frame</h2>
          </div>
          <div className="grid grid-4">
            {[
              { step: "01", title: "Share Your Photo", desc: "Send us your favourite photo — any format, any resolution. We handle the rest." },
              { step: "02", title: "Design & Quote", desc: "Our craftsmen sketch your frame and send a detailed quote within 24 hours." },
              { step: "03", title: "Crafted by Hand", desc: "Skilled artisans in Hyderabad hand-craft your metal frame with precision and love." },
              { step: "04", title: "Delivered with Care", desc: "Securely packed and shipped to your door, anywhere in India." },
            ].map((item) => (
              <div key={item.step} className="custom-process-step">
                <span className="custom-process-number">{item.step}</span>
                <h3 className="heading-sm mt-4 mb-2" style={{ color: "var(--text-dark)" }}>{item.title}</h3>
                <p className="text-body-sm" style={{ lineHeight: "var(--lh-loose)" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MATERIALS ── */}
      <section className="section" aria-labelledby="materials-title" style={{ background: "var(--surface-sunken)" }}>
        <div className="container">
          <div className="section-header">
            <span className="overline">Our Metals</span>
            <h2 id="materials-title" className="heading-lg">The Materials We Master</h2>
          </div>
          <div className="grid grid-3">
            {[
              { metal: "Brass", color: "#c8a43a", desc: "The metal of temples. Warm, lustrous and enduring — brass frames carry a timeless heritage look perfect for homes and gifting.", traits: ["Temple Grade", "Warm Golden Tone", "Ages Beautifully"] },
              { metal: "Bronze", color: "#a0522d", desc: "India's classical metal tradition spans 5,000 years. Bronze's rich patina deepens over time, making each frame a living artwork.", traits: ["Chola Tradition", "Rich Patina", "Museum Quality"] },
              { metal: "Aluminium", color: "#8fa3b1", desc: "For contemporary spaces that want the soul of craft without the weight. Lightweight, rust-proof and finished with stunning detail.", traits: ["Lightweight", "Powder Coated", "Modern Aesthetic"] },
            ].map((m) => (
              <div key={m.metal} className="custom-material-card">
                <div className="custom-material-swatch" style={{ background: m.color }} aria-hidden="true" />
                <h3 className="heading-sm mt-5 mb-2">{m.metal}</h3>
                <p className="text-body-sm mb-4" style={{ lineHeight: "var(--lh-loose)" }}>{m.desc}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {m.traits.map((t) => (<span key={t} className="badge badge-secondary">{t}</span>))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="section" aria-labelledby="custom-cta-title"
        style={{ background: "linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%)", textAlign: "center" }}>
        <div className="container-sm">
          <h2 id="custom-cta-title" className="heading-lg" style={{ color: "#fff", marginBottom: "var(--space-4)" }}>
            Your Perfect Frame Awaits
          </h2>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "var(--fs-16)", marginBottom: "var(--space-8)", lineHeight: "var(--lh-loose)" }}>
            From a cherished family portrait to a wedding memory — we bring your most precious moments to life in metal, forever.
          </p>
          <div style={{ display: "flex", gap: "var(--space-4)", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => setShowModal(true)} className="btn btn-secondary btn-lg" id="custom-final-cta-btn">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <SparkleIcon size={18} /> Start Custom Idol
              </span>
            </button>
            <a href={whatsappQuoteUrl} target="_blank" rel="noopener noreferrer"
              className="btn btn-lg"
              style={{ background: "#25D366", color: "#fff", border: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              WhatsApp Us
            </a>
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "var(--fs-13)", marginTop: "var(--space-6)" }}>
            {contactAddress} ·{" "}
            <a href={`mailto:${contactEmail}`} style={{ color: "var(--secondary)" }}>
              {contactEmail}
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
