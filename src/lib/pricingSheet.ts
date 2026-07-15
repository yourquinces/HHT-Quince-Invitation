// Fetches and parses live cabin pricing from the published Google Sheet.
// The sheet is the source of truth: edits there appear here on the next
// page load, with no redeploy. No API key, no backend.
//
// Sheet layout (per tab): repeating vertical blocks of
//   Category / Floor / Type of Cabin / Occupancy / Base Rate /
//   Port & Taxes / Total Per Person / Cabin Total
// grouped under section headings like "Inside Cabin" or "Balconies".

export interface Cabin {
  section: string;
  category: string;
  floor: string;
  type: string;
  occupancy: string;
  baseRate: string;
  portTaxes: string;
  totalPerPerson: string;
  cabinTotal: string;
}

export interface CabinSection {
  name: string;
  cabins: Cabin[];
}

/** Builds the CSV export URL for one tab of the published sheet. */
export function csvUrl(publishedId: string, gid: string): string {
  return `https://docs.google.com/spreadsheets/d/e/${publishedId}/pub?gid=${gid}&single=true&output=csv`;
}

/** Minimal CSV parser that handles quoted fields, embedded commas and newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  row.push(field);
  rows.push(row);
  return rows;
}

const FIELD_LABELS: Record<string, keyof Cabin> = {
  category: "category",
  floor: "floor",
  "type of cabin": "type",
  occupancy: "occupancy",
  "base rate": "baseRate",
  "port & taxes": "portTaxes",
  "port and taxes": "portTaxes",
  "total per person": "totalPerPerson",
  "cabin total": "cabinTotal",
};

// Rows in column B that are informational text, not section headings.
const HEADING_NOISE =
  /click here|deposit|final payment|subject to availability|promotion|occupancy \(|happy holidays|coral way|icon of the seas|from miami/i;

/** Extracts cabins (grouped into sections) from a parsed CSV grid. */
export function parseCabins(rows: string[][]): CabinSection[] {
  const sections: CabinSection[] = [];
  const byName = new Map<string, CabinSection>();
  let currentSection = "Cabins";
  let current: Partial<Cabin> | null = null;

  const commit = () => {
    if (current && current.category && current.type && current.totalPerPerson) {
      const cabin: Cabin = {
        section: currentSection,
        category: current.category ?? "",
        floor: current.floor ?? "",
        type: (current.type ?? "").trim(),
        occupancy: current.occupancy ?? "",
        baseRate: current.baseRate ?? "",
        portTaxes: current.portTaxes ?? "",
        totalPerPerson: current.totalPerPerson ?? "",
        cabinTotal: current.cabinTotal ?? "",
      };
      let section = byName.get(currentSection);
      if (!section) {
        section = { name: currentSection, cabins: [] };
        byName.set(currentSection, section);
        sections.push(section);
      }
      section.cabins.push(cabin);
    }
    current = null;
  };

  for (const row of rows) {
    const label = (row[1] ?? "").trim();
    const value = (row[2] ?? "").trim();
    if (!label) continue;

    const fieldKey = FIELD_LABELS[label.toLowerCase()];
    if (fieldKey) {
      if (fieldKey === "category") {
        commit();
        current = { category: value };
      } else if (current) {
        current[fieldKey] = value;
        if (fieldKey === "cabinTotal") commit();
      }
      continue;
    }

    // A non-field row with text in column B and nothing in column C
    // is a section heading, unless it matches known informational text.
    if (!value && !HEADING_NOISE.test(label)) {
      commit();
      currentSection = label;
    }
  }
  commit();
  return sections;
}

/** Reformats a sheet money string like "$1,469.00" as clean USD. */
export function formatUsd(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const n = Number(cleaned);
  if (!cleaned || !isFinite(n)) return raw.trim();
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/** Fetches one tab and returns its parsed sections. Throws on HTTP errors. */
export async function fetchCabinSections(
  publishedId: string,
  gid: string,
): Promise<CabinSection[]> {
  const res = await fetch(csvUrl(publishedId, gid), { cache: "no-store" });
  if (!res.ok) throw new Error(`Pricing sheet returned ${res.status}`);
  const text = await res.text();
  const sections = parseCabins(parseCsv(text));
  if (sections.length === 0) throw new Error("No cabins found in the pricing sheet");
  return sections;
}
