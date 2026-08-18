// Her profile picture, or a cartoon until she uploads one.
//
// The cartoon is drawn inline rather than shipped as an image file: it stays
// sharp at any size, costs no request, and follows the site's colours. It is
// deliberately generic — a crown and a silhouette, no skin tone, no hair
// colour — because it stands in for every girl until she replaces it, and a
// specific-looking default would fit some of them and not others.

interface Props {
  src?: string | null;
  name?: string | null;
  /** Pixel size of the circle. */
  size?: number;
  className?: string;
}

export default function QuinceAvatar({ src, name, size = 96, className = "" }: Props) {
  const alt = name ? `${name}'s photo` : "Quinceañera photo";

  return (
    <span
      className={`inline-block overflow-hidden rounded-full bg-white ring-2 ring-blush-200 ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={alt} width={size} height={size}
             className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <svg viewBox="0 0 96 96" width={size} height={size} role="img"
             aria-label="Cartoon quinceañera avatar" className="h-full w-full">
          <defs>
            <linearGradient id="qa-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FCE7F3" />
              <stop offset="100%" stopColor="#DBEAFE" />
            </linearGradient>
            <linearGradient id="qa-dress" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#DB3EB1" />
              <stop offset="100%" stopColor="#41B6E6" />
            </linearGradient>
          </defs>

          <circle cx="48" cy="48" r="48" fill="url(#qa-bg)" />

          {/* Shoulders and gown, clipped by the circle above */}
          <path d="M48 62c-15 0-27 10-30 24h60c-3-14-15-24-30-24z" fill="url(#qa-dress)" />

          {/* Head */}
          <circle cx="48" cy="42" r="17" fill="#F6E0D2" />

          {/* Hair: a soft frame plus a low bun, the shape most quinceañera
              updos read as at this size */}
          <path d="M31 42c0-11 8-19 17-19s17 8 17 19c0-6-5-9-9-10-3 3-9 4-14 3-5-1-8 2-11 7z" fill="#3B2A24" />
          <circle cx="48" cy="24" r="6" fill="#3B2A24" />

          {/* Tiara */}
          <path d="M39 27l3-6 3 4 3-6 3 6 3-4 3 6z" fill="#F2C14E" />
          <circle cx="48" cy="19" r="2" fill="#FFF3D6" />

          {/* Face: two dots and a small smile — any more detail turns muddy
              at 40 pixels, which is where this is usually seen */}
          <circle cx="42" cy="42" r="1.8" fill="#3B2A24" />
          <circle cx="54" cy="42" r="1.8" fill="#3B2A24" />
          <path d="M43 49c2 2.5 8 2.5 10 0" stroke="#3B2A24" strokeWidth="1.8"
                strokeLinecap="round" fill="none" />
        </svg>
      )}
    </span>
  );
}
