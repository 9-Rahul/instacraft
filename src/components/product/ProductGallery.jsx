'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ProductGallery({ images, title, outOfStock }) {
  const [active, setActive] = useState(0);

  const imageStyle = {
    display: 'block',
    width: '100%',
    height: 'auto',
    filter: outOfStock ? 'grayscale(1) opacity(0.7)' : 'none',
    transition: 'filter 0.5s ease, opacity 0.5s ease'
  };

  return (
    <div className="product-gallery">
      {/* Main image */}
      <div className="product-gallery-main">
        <Image
          src={images[active]}
          alt={`${title} — image ${active + 1} of ${images.length}`}
          width={800}
          height={800}
          priority
          style={imageStyle}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="product-gallery-thumbs" role="tablist" aria-label="Product images">
          {images.map((src, i) => (
            <button
              key={i}
              className={`product-gallery-thumb${i === active ? ' active' : ''}`}
              onClick={() => setActive(i)}
              role="tab"
              aria-selected={i === active}
              aria-label={`View image ${i + 1}`}
            >
              <Image src={src} alt={`${title} thumbnail ${i + 1}`} width={100} height={100} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
