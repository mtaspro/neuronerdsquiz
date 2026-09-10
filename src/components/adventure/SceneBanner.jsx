import React, { useState } from 'react';

/**
 * SceneBanner — 16:9 responsive scene background banner with graceful fallback.
 *
 * - Renders the CDN banner image (`bannerUrl`) when provided, scaled with
 *   `object-cover` inside a strict 16:9 (`aspect-video`) container that
 *   responds fluidly to any screen width.
 * - Falls back to a themed gradient panel with the scene title if the URL
 *   is missing OR fails to load.
 */
export default function SceneBanner({ title = '', bannerUrl = null, className = '' }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(bannerUrl) && !failed;

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 via-slate-900 to-black ${className}`}
    >
      {showImage ? (
        <img
          src={bannerUrl}
          alt={title || 'scene banner'}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-4 text-center">
          <span className="font-display text-lg font-bold uppercase tracking-widest text-white/60 sm:text-xl">
            {title}
          </span>
        </div>
      )}
    </div>
  );
}
