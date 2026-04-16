'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  MapPin,
  Handshake,
  Leaf,
  ScrollText,
  GraduationCap,
} from "lucide-react";
import { getSiteContent } from "@/lib/api";

export default function AboutContent() {
  const [content, setContent] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      const data = await getSiteContent();
      setContent(data.about);
    };
    fetchContent();
  }, []);

  if (!content) return <div className="section" style={{ minHeight: '80vh' }}></div>;

  const { hero = {}, mission = {}, artisans = { list: [] }, values = { list: [] } } = content;

  // Icon mapping for values
  const iconMap = {
    Handshake: <Handshake size={32} />,
    Leaf: <Leaf size={32} />,
    ScrollText: <ScrollText size={32} />,
    GraduationCap: <GraduationCap size={32} />,
  };

  return (
    <>
      {/* Hero */}
      <section
        className="section"
        style={{ 
          position: "relative",
          background: hero.image ? `url(${hero.image}) center/cover no-repeat` : "var(--primary-dark)", 
          textAlign: "center",
          minHeight: "40vh",
          display: "flex",
          alignItems: "center",
          color: "#fff",
          overflow: "hidden"
        }}
        aria-labelledby="about-title"
      >
        {hero.image && (
          <div style={{ 
            position: "absolute", 
            inset: 0, 
            background: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.7))",
            zIndex: 1 
          }} />
        )}
        <div className="container-sm" style={{ position: "relative", zIndex: 2 }}>
          <span className="overline" style={{ color: "var(--secondary)" }}>
            {hero.overline}
          </span>
          <h1
            id="about-title"
            className="heading-xl"
            style={{ color: "#fff", margin: "var(--space-3) 0 var(--space-6)" }}
          >
            {hero.title}
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.9)",
              fontSize: "var(--fs-18)",
              lineHeight: "var(--lh-loose)",
              maxWidth: "800px",
              margin: "0 auto"
            }}
          >
            Ishta Crafts is a premier artisan marketplace dedicated to bridging the gap between master Indian craft traditions and global heritage enthusiasts. Our mission is to ensure every handcrafted piece tells a story while supporting a sustainable future for our artisan collective.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="section" id="mission" aria-labelledby="mission-title">
        <div className="container">
          <div className="responsive-grid-2" style={{ alignItems: "center" }}>
            {mission.image ? (
              <Image
                src={mission.image}
                alt={mission.title ? `Our Mission: ${mission.title}` : "Handicraft Artisan at work - Ishta Crafts Mission"}
                width={600}
                height={800}
                priority
                style={{
                  borderRadius: "var(--border-radius-xl)",
                  width: "100%",
                  height: "auto",
                }}
              />
            ) : (
              <div style={{ paddingBottom: "133%", background: "var(--surface)", borderRadius: "var(--border-radius-xl)" }} />
            )}
            <div>
              <span className="overline">{mission.overline}</span>
              <h2 id="mission-title" className="heading-lg mt-2 mb-5">
                {mission.title}
              </h2>
              <p
                className="text-body mb-4"
                style={{ lineHeight: "var(--lh-loose)" }}
              >
                {mission.text1}
              </p>
              <p
                className="text-body mb-4"
                style={{ lineHeight: "var(--lh-loose)" }}
              >
                {mission.text2}
              </p>
              <p
                className="text-body mb-6"
                style={{ lineHeight: "var(--lh-loose)" }}
              >
                {mission.text3}
              </p>
              <div className="grid grid-3" style={{ gap: "var(--space-4)" }}>
                {(mission.stats || []).map((stat) => (
                  <div key={stat.label} className="card card-sm">
                    <div className="card-body" style={{ textAlign: "center" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontSize: "var(--fs-28)",
                          fontWeight: 700,
                          color: "var(--primary)",
                          display: "block",
                        }}
                      >
                        {stat.number}
                      </span>
                      <span className="text-muted">{stat.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Artisans */}
      <section
        className="section bg-surface-sunken"
        id="artisans"
        aria-labelledby="artisans-title"
      >
        <div className="container">
          <div className="section-header">
            <span className="overline">{artisans.overline}</span>
            <h2 id="artisans-title" className="heading-lg">
              {artisans.title}
            </h2>
            <p className="text-body">
              {artisans.description}
            </p>
          </div>
          <div className="grid grid-3">
            {(artisans.list || []).map((a) => (
              <article key={a.name} className="card">
                {a.avatar ? (
                  <Image
                    src={a.avatar}
                    alt={`${a.name} - Master Craftsman specialized in ${a.craft}`}
                    width={400}
                    height={300}
                    style={{
                      width: "100%",
                      aspectRatio: "4/3",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div style={{ width: "100%", aspectRatio: "4/3", background: "var(--surface)" }} />
                )}
                <div className="card-body">
                  <span className="overline mb-2">{a.craft}</span>
                  <h3 className="heading-sm">{a.name}</h3>
                  <p
                    style={{
                      fontSize: "var(--fs-13)",
                      color: "var(--secondary-dark)",
                      marginBottom: "var(--space-3)",
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={14} />
                      {a.location}
                    </span>
                  </p>
                  <p
                    className="text-body-sm"
                    style={{ lineHeight: "var(--lh-loose)" }}
                  >
                    {a.story}
                  </p>
                  <div className="mt-4">
                    <span className="badge badge-secondary">
                      {a.yearsActive} years of craft
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section" aria-labelledby="values-title">
        <div className="container">
          <div className="section-header">
            <span className="overline">{values.overline}</span>
            <h2 id="values-title" className="heading-lg">
              {values.title}
            </h2>
          </div>
          <div className="grid grid-4">
            {(values.list || []).map((v) => (
              <div key={v.title} className="card">
                <div className="card-body" style={{ textAlign: "center" }}>
                  <span
                    style={{
                      fontSize: 36,
                      display: "block",
                      marginBottom: "var(--space-4)",
                    }}
                    aria-hidden="true"
                  >
                    {iconMap[v.icon]}
                  </span>
                  <h3 className="heading-sm mb-2">{v.title}</h3>
                  <p className="text-body-sm">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
