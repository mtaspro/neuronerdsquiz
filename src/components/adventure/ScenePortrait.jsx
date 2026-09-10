import React, { useState } from 'react';

/**
 * ScenePortrait — 2D comic character portrait renderer with graceful fallback.
 *
 * - Renders the CDN avatar image (`avatarUrl`) when provided.
 * - Falls back to the character's `emoji` if the URL is missing OR fails
 *   to load (network error / 404).
 * - Container strictly enforces a 1:1 aspect ratio with `object-cover`
 *   and rounded comic-theme borders.
 *
 * Reference usage:
 *   <ScenePortrait name="মন্দিরের রক্ষক" emoji="🗿" avatarUrl={url} />
 */
export default function ScenePortrait({
  name = '',
  emoji = '🙂',
  avatarUrl = null,
  sizeClass = 'w-14 h-14',
  emojiClass = 'text-3xl',
  borderClass = 'border-2 border-slate-700',
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(avatarUrl) && !failed;

  return (
    <div
      className={`relative ${sizeClass} aspect-square shrink-0 overflow-hidden rounded-lg ${borderClass} bg-slate-900`}
      title={name}
    >
      {showImage ? (
        <img
          src={avatarUrl}
          alt={name || 'character portrait'}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={`flex h-full w-full items-center justify-center ${emojiClass}`}>
          {emoji}
        </span>
      )}
    </div>
  );
}
