'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ProductGallery({ images, title }) {
  const [active, setActive] = useState(0);

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
          style={{ display: 'block', width: '100%', height: 'auto' }}
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
