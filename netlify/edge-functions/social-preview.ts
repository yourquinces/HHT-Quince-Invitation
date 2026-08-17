/**
 * Per-invitation link previews.
 *
 * WhatsApp, Facebook and iMessage read the <meta> tags out of the HTML and
 * never run the app's JavaScript, so a single-page app serves every link the
 * same tags. Every invitation previewed as the same girl's name, with no
 * picture at all — the og:image was pointing at a file that did not exist on a
 * domain that was never filled in.
 *
 * This runs at the edge, fetches the invitation the URL is asking for, and
 * rewrites the block between the SOCIAL markers in index.html before the
 * crawler sees it. The app itself is untouched: it still renders client-side.
 *
 * Two shapes of page, and the difference matters:
 *   /i/<slug>   her quinceañera invitation. Her uploaded photo is the picture
 *               worth showing; the ship stands in until she uploads one.
 *   /c/<code>   the general cruise invitation a booked relative forwards. It
 *               must NOT name her and must NOT use her photo — the preview is
 *               the first thing a stranger sees, so a leak here would defeat
 *               the whole page. Ship photo, neutral wording, always.
 */

// Same publishable key the browser bundle already ships. Row-level security
// exposes active invitations only.
const SUPABASE_URL = "https://jpgwcfswnfytyqzklrba.supabase.co";
const SUPABASE_KEY = "sb_publishable_122S5BZIb5_yjD2ofGDuuA_nDeB7fuZ";

// Purpose-made share crops: 1200x630 and under 300 KB. The photos used on the
// page itself are portrait or square, which WhatsApp renders as a cramped
// little thumbnail instead of a preview card, and heavy files get no thumbnail
// at all. Regenerate with the recipe in README if a ship photo changes.
const SHIP_IMAGE: Record<string, string> = {
  "Icon of the Seas": "/images/icon-share.jpg",
  "Allure of the Seas": "/images/allure-share.jpg",
  "Odyssey of the Seas": "/images/odyssey-share.jpg",
};
const DEFAULT_IMAGE = "/images/icon-share.jpg";

interface Row {
  slug: string;
  quinceanera_name: string | null;
  preferred_name: string | null;
  ship: string | null;
  sailing_dates: string | null;
  hero_image_url: string | null;
}

const attr = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** A forwarded name is decoration; keep it short and plain. */
function cleanFrom(raw: string | null): string {
  if (!raw) return "";
  return raw.replace(/[^\p{L}\p{M}'’.\- ]/gu, "").trim().slice(0, 40);
}

async function fetchRow(field: "slug" | "group_code", value: string): Promise<Row | null> {
  const url =
    `${SUPABASE_URL}/rest/v1/invitations?${field}=eq.${encodeURIComponent(value)}` +
    `&status=eq.active&limit=1` +
    `&select=slug,quinceanera_name,preferred_name,ship,sailing_dates,hero_image_url`;
  try {
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as Row[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

function tags(o: { title: string; description: string; image: string; url: string }) {
  const t = attr(o.title);
  const d = attr(o.description);
  const i = attr(o.image);
  const u = attr(o.url);
  return `<title>${t}</title>
    <meta name="description" content="${d}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:image" content="${i}" />
    <meta property="og:image:alt" content="${t}" />
    <meta property="og:url" content="${u}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${i}" />`;
}

export default async (request: Request, context: { next: () => Promise<Response> }) => {
  const res = await context.next();

  // Only rewrite the app shell. Assets and JSON pass straight through.
  const type = res.headers.get("content-type") || "";
  if (!type.includes("text/html")) return res;

  const url = new URL(request.url);
  const origin = url.origin;
  const path = url.pathname.replace(/\/+$/, "");

  const codeMatch = path.match(/^\/c\/([A-Za-z0-9_-]+)$/);
  const slugMatch = path.match(/^\/i\/([^/]+)(?:\/.*)?$/);

  let row: Row | null = null;
  let neutral = false;
  if (codeMatch) {
    row = await fetchRow("group_code", codeMatch[1]);
    neutral = true;
  } else if (slugMatch) {
    row = await fetchRow("slug", decodeURIComponent(slugMatch[1]));
  }

  // Unknown or revoked link: leave the fallback tags alone rather than
  // inventing a preview for a page that will say "we could not find this".
  if (!row) return res;

  const ship = row.ship || "Royal Caribbean";
  const dates = row.sailing_dates ? ` ${row.sailing_dates}` : "";
  const shipImage = SHIP_IMAGE[ship] || DEFAULT_IMAGE;

  let title: string;
  let description: string;
  let image: string;

  if (neutral) {
    const from = cleanFrom(url.searchParams.get("from"));
    title = `Join Our Group Cruise · ${ship}`;
    description =
      (from ? `${from} would love you to join. ` : "") +
      `A group of families and friends sailing aboard ${ship}${dates}. ` +
      `Group rates, cabin options and payment plans through Happy Holidays Travel.`;
    // Never her photo here. The point of this page is that a stranger cannot
    // tell whose cruise it is, and a preview thumbnail is the loudest hint.
    image = shipImage;
  } else {
    const name = row.preferred_name || row.quinceanera_name || "our quinceañera";
    title = `Celebrate ${name}'s Quinceañera Cruise | ${ship}`;
    description =
      `Join ${name}, her family and friends aboard ${ship}${dates}. ` +
      `Cruise details, cabin prices and how to reserve your cabin.`;
    // Her own photo is the picture people actually want to see.
    image = row.hero_image_url || shipImage;
  }

  const absolute = image.startsWith("http") ? image : origin + image;

  const html = await res.text();
  const replaced = html.replace(
    /<!--SOCIAL:START-->[\s\S]*?<!--SOCIAL:END-->/,
    tags({ title, description, image: absolute, url: origin + url.pathname }),
  );

  return new Response(replaced, {
    status: res.status,
    headers: res.headers,
  });
};

export const config = { path: ["/i/*", "/c/*"] };
