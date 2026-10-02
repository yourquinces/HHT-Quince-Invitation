// Spanish wording for the facts that come out of the data in English —
// sailing dates and itinerary names. Pure functions with no browser globals,
// so the social-preview edge function can import them too.

const MONTHS: Record<string, string> = {
  January: "enero", February: "febrero", March: "marzo", April: "abril",
  May: "mayo", June: "junio", July: "julio", August: "agosto",
  September: "septiembre", October: "octubre", November: "noviembre", December: "diciembre",
};

/**
 * "July 24–31, 2027"          → "24 al 31 de julio de 2027"
 * "July 25 – August 2, 2026"  → "25 de julio al 2 de agosto de 2026"
 * Anything else is returned as typed rather than half-translated.
 */
export function datesEs(dates: string): string {
  const same = dates.match(/^([A-Z][a-z]+) (\d{1,2})\s*[–-]\s*(\d{1,2}), (\d{4})$/);
  if (same && MONTHS[same[1]]) return `${same[2]} al ${same[3]} de ${MONTHS[same[1]]} de ${same[4]}`;
  const span = dates.match(/^([A-Z][a-z]+) (\d{1,2})\s*[–-]\s*([A-Z][a-z]+) (\d{1,2}), (\d{4})$/);
  if (span && MONTHS[span[1]] && MONTHS[span[3]])
    return `${span[2]} de ${MONTHS[span[1]]} al ${span[4]} de ${MONTHS[span[3]]} de ${span[5]}`;
  return dates;
}

const ITINERARIES: Record<string, string> = {
  "Eastern Caribbean": "Caribe Oriental",
  "Western Caribbean": "Caribe Occidental",
  "Southern Caribbean": "Caribe Sur",
  "Eastern Mediterranean": "Mediterráneo Oriental",
  "Western Mediterranean": "Mediterráneo Occidental",
};

export function itineraryEs(name: string): string {
  return ITINERARIES[name] ?? name;
}
