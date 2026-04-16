'use client';

/**
 * Deals page — reads offers from localStorage (admin-synced).
 * Converted to a client component so it picks up admin changes.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DealsPage() {
  const [allOffers, setAllOffers]   = useState([]);
  const [loading,   setLoading]     = useState(true);

  useEffect(() => {
    async function fetchOffers() {
      try {
        const res = await fetch('/api/offers/active?all=true');
        if (res.ok) {
          const data = await res.json();
          setAllOffers(data);
        }
      } catch (error) {
        console.error('Error fetching offers:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchOffers();
  }, []);

  const active  = allOffers.filter(o => o.active);
  const expired = allOffers.filter(o => !o.active);

  if (loading) {
    return <div className="section"><div className="container py-12 text-center">Loading deals...</div></div>;
  }

  return (
    <div className="section">
      <div className="container">
        {/* Header */}
        <div className="section-header mb-10">
          <span className="overline">Limited Time</span>
          <h1 className="heading-lg">Deals &amp; Offers</h1>
          <p className="text-body">Handpicked deals on authentic Indian handicrafts</p>
        </div>

        {/* Active offers */}
        <h2 className="heading-md mb-6">Active Offers</h2>
        <div className="deals-grid" style={{ marginBottom: 'var(--space-12)' }}>
          {active.length === 0 && (
            <p className="text-muted">No offer available</p>
          )}
          {active.map(offer => (
            <div
              key={offer.id}
              className="offer-card"
              style={{ background: offer.bgColor }}
              role="article"
            >
              {/* Text content */}
              <div className="offer-card-body">
                <span
                  className="badge"
                  style={{
                    background: offer.textColor,
                    color: offer.bgColor,
                    marginBottom: 'var(--space-3)',
                    display: 'inline-block',
                  }}
                >
                  {offer.type === 'percentage'
                    ? `${offer.discount}% OFF`
                    : offer.type === 'flat'
                    ? `₹${offer.discount} OFF`
                    : 'FREE SHIPPING'}
                </span>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--fs-22)', color: offer.textColor, fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                  {offer.title}
                </h3>
                <p style={{ color: offer.textColor, opacity: 0.8, fontSize: 'var(--fs-15)', marginBottom: 'var(--space-2)' }}>
                  {offer.description}
                </p>
                <p style={{ color: offer.textColor, opacity: 0.6, fontSize: 'var(--fs-13)', marginBottom: 'var(--space-5)' }}>
                  Valid until {new Date(offer.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <Link
                  href={offer.category ? `/shop/${offer.category}` : '/shop'}
                  className="btn btn-sm"
                  style={{ background: offer.textColor, color: offer.bgColor, border: 'none' }}
                >
                  Shop Now →
                </Link>
              </div>

              {/* Image */}
              <img
                src={offer.image}
                alt={offer.title}
                className="offer-card-img"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        {/* Expired offers */}
        {expired.length > 0 && (
          <>
            <h2 className="heading-md mb-6" style={{ color: 'var(--text-muted)' }}>Past Offers</h2>
            <div className="deals-grid">
              {expired.map(offer => (
                <div
                  key={offer.id}
                  className="offer-expired-card"
                >
                  <img
                    src={offer.image}
                    alt={offer.title}
                    className="offer-expired-img"
                    loading="lazy"
                  />
                  <div>
                    <span className="badge badge-neutral mb-2">Expired</span>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--fs-18)', color: 'var(--text-dark)' }}>{offer.title}</h3>
                    <p className="text-muted mt-1">{offer.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

