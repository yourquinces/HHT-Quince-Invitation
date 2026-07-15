// Cabin photos for the pricing page, served from the public Supabase
// Storage bucket `cabin-photos`. HHT staff upload photos in the Supabase
// dashboard (Storage → cabin-photos) — no code change or redeploy needed.
//
// A photo appears on a cabin card when its filename (without extension)
// matches either:
//   - the category code, e.g.        V4.jpg
//   - the cabin type name, e.g.      Ocean View Balcony.jpg
//                                    (or ocean-view-balcony.jpg)
// Type-name matches apply across all occupancy tabs at once, so one
// "Ocean View Balcony" photo covers D4, D5 and D3.

import { SUPABASE_KEY, SUPABASE_URL } from "./supabase";
import type { Cabin } from "./pricingSheet";

const BUCKET = "cabin-photos";

/** Normalizes "Ocean View Balcony.jpg" and "ocean-view-balcony" alike. */
function photoKey(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Lists the bucket once and returns normalized-name → public URL. */
export async function fetchCabinPhotoMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefix: "", limit: 500 }),
    });
    if (!res.ok) return map;
    const files: Array<{ name?: string; id?: string }> = await res.json();
    for (const f of files) {
      // Folders come back without an id; skip them and placeholder files.
      if (!f.name || !f.id || f.name.startsWith(".")) continue;
      const key = photoKey(f.name.replace(/\.[^.]+$/, ""));
      if (!key) continue;
      map.set(key, `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(f.name)}`);
    }
  } catch {
    // No photos is a fine state — cards simply render without images.
  }
  return map;
}

/** Finds the photo for a cabin: category code first, then type name. */
export function cabinPhotoFor(map: Map<string, string>, cabin: Cabin): string | null {
  const candidates = [
    photoKey(cabin.category),
    photoKey(cabin.type),
    photoKey(cabin.type.replace(/\(.*?\)/g, "")), // "Interior (No Window)" → "interior"
  ];
  for (const key of candidates) {
    if (key && map.has(key)) return map.get(key)!;
  }
  return null;
}
