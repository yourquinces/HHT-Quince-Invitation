// The shared cabin-pricing UI — sailing picker, occupancy toggle, and the
// grid of cabin cards with live rates from the published Google Sheets.
//
// Rendered by BOTH pages, so they can never drift apart:
//   /pricing         (PricingPage)        — linked from each invitation
//   /quince-cruises  (QuinceCruisesPage)  — public page for email leads
//
// Everything above the controls differs between the two, so the page
// passes its own `header`. Selection is controlled by the page, because
// each one syncs it to its own URL shape.

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { PricingSailing } from "../types/invitation";
import { cabinPhotoFor, fetchCabinPhotoMap } from "../lib/cabinPhotos";
import { fetchCabinSections, formatUsd } from "../lib/pricingSheet";
import type { Cabin, CabinSection } from "../lib/pricingSheet";
import Icon from "./Icon";
import SecondaryButton from "./SecondaryButton";

type TabState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; sections: CabinSection[] };

interface Props {
  /** The sailing whose rates are shown. */
  sailing: PricingSailing;
  /** Guests per cabin ("1".."4") — matches a tab on the sailing. */
  guests: string;
  onGuestsChange: (guests: string) => void;
  /** Sailings offered in the dropdown. Omit (or pass one) to hide it. */
  pickerSailings?: PricingSailing[];
  onSailingChange?: (id: string) => void;
  /** Hero content rendered above the controls, on the same panel. */
  header?: ReactNode;
  /** Background of the controls panel. Defaults to the blush gradient. */
  controlsClassName?: string;
  /** Anchor id for the results grid, for in-page links. */
  resultsId?: string;
  /** Per-cabin call to action, rendered at the bottom of every card.
   *  The destination differs by page — /pricing sends an invited family
   *  to the booking form, /quince-cruises sends a new lead to the inquiry
   *  form — so each page supplies its own. Return null to omit it for a
   *  particular cabin. `guests` is the resolved tab, not the requested one. */
  cabinCta?: (
    cabin: Cabin,
    guests: string,
  ) => { label: string; href?: string; onClick?: () => void } | null;
}

const DEFAULT_CONTROLS =
  "relative overflow-hidden bg-gradient-to-b from-blush-100 via-blush-50 to-white px-5 pb-10 pt-12 text-center sm:px-8 sm:pt-16";

// Full-width so it reads as the card's action, not an afterthought.
const CTA_CLASS =
  "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-royal-600 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-white shadow transition hover:bg-royal-700 active:bg-royal-800";

export default function CabinPricingBrowser({
  sailing,
  guests,
  onGuestsChange,
  pickerSailings,
  onSailingChange,
  header,
  controlsClassName = DEFAULT_CONTROLS,
  resultsId,
  cabinCta,
}: Props) {
  const [tabData, setTabData] = useState<Record<string, TabState>>({});
  const [reloadKey, setReloadKey] = useState(0);
  const [photos, setPhotos] = useState<Map<string, string>>(() => new Map());

  // Fall back gracefully when this sailing has no tab for the chosen count
  // (e.g. One Guest exists only on some sailings).
  const tab = sailing.tabs.find((t) => t.guests === guests) ?? sailing.tabs[0];
  const cacheKey = `${sailing.publishedId}:${tab.gid}`;
  const showPicker = !!onSailingChange && !!pickerSailings && pickerSailings.length > 1;

  // Cabin photos uploaded by HHT staff (Supabase Storage → cabin-photos).
  useEffect(() => {
    let cancelled = false;
    fetchCabinPhotoMap().then((map) => {
      if (!cancelled && map.size > 0) setPhotos(map);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setTabData((d) =>
      d[cacheKey]?.status === "ready" ? d : { ...d, [cacheKey]: { status: "loading" } },
    );
    fetchCabinSections(sailing.publishedId, tab.gid)
      .then((sections) => {
        if (!cancelled)
          setTabData((d) => ({ ...d, [cacheKey]: { status: "ready", sections } }));
      })
      .catch(() => {
        if (!cancelled)
          setTabData((d) =>
            d[cacheKey]?.status === "ready" ? d : { ...d, [cacheKey]: { status: "error" } },
          );
      });
    return () => {
      cancelled = true;
    };
  }, [cacheKey, sailing.publishedId, tab.gid, reloadKey]);

  const state: TabState = tabData[cacheKey] ?? { status: "loading" };

  return (
    <>
      <section className={controlsClassName}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-rosa-200/40 blur-3xl"
        />
        <div className="relative mx-auto max-w-content">
          {header}

          {showPicker && (
            <div className="mt-8">
              <label
                htmlFor="sailing-select"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gold-600"
              >
                Choose Your Sailing
              </label>
              <select
                id="sailing-select"
                value={sailing.id}
                onChange={(e) => onSailingChange?.(e.target.value)}
                className="mx-auto w-full max-w-md rounded-full border border-blush-200 bg-white px-5 py-3.5 text-center font-medium text-royal-800 shadow-sm"
              >
                {pickerSailings?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} · {s.ship}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div
            className="mx-auto mt-6 inline-flex max-w-full flex-col gap-1.5 rounded-3xl bg-white p-1.5 shadow-sm ring-1 ring-blush-200 sm:flex-row sm:rounded-full"
            role="group"
            aria-label="Guests per cabin"
          >
            {sailing.tabs.map((t) => (
              <button
                key={t.gid}
                type="button"
                onClick={() => onGuestsChange(t.guests)}
                aria-pressed={t.guests === tab.guests}
                className={`rounded-full px-6 py-3 text-sm font-semibold transition ${
                  t.guests === tab.guests
                    ? "bg-royal-600 text-white shadow"
                    : "text-royal-700 hover:bg-royal-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <p className="mt-5 text-sm text-slate-500">
            Prices are per person in US dollars and subject to availability.
          </p>
        </div>
      </section>

      <section id={resultsId} className="px-5 pb-16 sm:px-8">
        <div className="mx-auto max-w-content">
          {state.status === "loading" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-3xl bg-blush-100 ring-1 ring-blush-200"
                />
              ))}
            </div>
          )}
          {state.status === "loading" && (
            <p role="status" className="mt-6 text-center text-sm text-slate-500">
              Loading the latest prices…
            </p>
          )}

          {state.status === "error" && (
            <div className="mx-auto max-w-xl rounded-3xl bg-blush-100 p-8 text-center ring-1 ring-blush-200">
              <span className="inline-flex rounded-full bg-white p-3 text-royal-600">
                <Icon name="info" className="h-6 w-6" />
              </span>
              <p className="mt-4 text-lg font-medium text-royal-800">
                We could not load the latest prices right now.
              </p>
              <p className="mt-2 text-sm text-slate-600">
                You can view them directly on our pricing sheet, or try again in a moment.
              </p>
              <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
                <SecondaryButton href={sailing.backupUrl}>
                  Open the Pricing Sheet
                  <Icon name="externalLink" className="h-4 w-4" />
                </SecondaryButton>
                <SecondaryButton onClick={() => setReloadKey((k) => k + 1)}>
                  Try Again
                </SecondaryButton>
              </div>
            </div>
          )}

          {state.status === "ready" &&
            state.sections.map((section) => (
              <div key={section.name} className="mt-10 first:mt-2">
                <h2 className="mb-5 text-center font-display text-2xl font-bold text-royal-800 sm:text-3xl">
                  {section.name}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {section.cabins.map((cabin) => {
                    const photo = cabinPhotoFor(photos, cabin);
                    const mainPrice = cabin.totalPerPerson || cabin.cabinTotal;
                    const mainLabel = cabin.totalPerPerson ? "Total per person" : "Cabin total";
                    const cta = cabinCta?.(cabin, tab.guests) ?? null;
                    return (
                      <div
                        key={`${cabin.category}-${cabin.type}`}
                        className={`flex flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blush-200 ${
                          cta ? "transition hover:shadow-md hover:ring-royal-200" : ""
                        }`}
                      >
                        {photo && (
                          <img
                            src={photo}
                            alt={`${cabin.type} cabin`}
                            className="mb-5 aspect-[16/10] w-full rounded-2xl object-cover ring-1 ring-blush-200"
                            loading="lazy"
                          />
                        )}
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-display text-lg font-semibold leading-snug text-royal-800">
                            {cabin.type}
                          </h3>
                          <span className="shrink-0 rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-600">
                            {cabin.category}
                          </span>
                        </div>
                        {cabin.floor && (
                          <p className="mt-1.5 text-sm text-slate-500">Decks {cabin.floor}</p>
                        )}

                        <dl className="mt-4 space-y-1.5 border-t border-blush-200 pt-4 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-slate-500">Base rate</dt>
                            <dd className="font-medium text-slate-700">
                              {formatUsd(cabin.baseRate)}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-slate-500">Port and taxes</dt>
                            <dd className="font-medium text-slate-700">
                              {formatUsd(cabin.portTaxes)}
                            </dd>
                          </div>
                        </dl>

                        <div className="mt-4 rounded-2xl bg-blush-50 p-4 text-center">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">
                            {mainLabel}
                          </p>
                          <p className="mt-1 font-display text-2xl font-bold text-royal-800">
                            {formatUsd(mainPrice)}
                          </p>
                          {cabin.totalPerPerson && cabin.cabinTotal && (
                            <p className="mt-1 text-xs text-slate-500">
                              Cabin total {formatUsd(cabin.cabinTotal)}
                            </p>
                          )}
                        </div>

                        {cta &&
                          (cta.href ? (
                            <a
                              href={cta.href}
                              target={cta.href.startsWith("http") ? "_blank" : undefined}
                              rel={cta.href.startsWith("http") ? "noopener noreferrer" : undefined}
                              className={CTA_CLASS}
                            >
                              {cta.label}
                              <Icon name="check" className="h-4 w-4" />
                            </a>
                          ) : (
                            <button type="button" onClick={cta.onClick} className={CTA_CLASS}>
                              {cta.label}
                              <Icon name="check" className="h-4 w-4" />
                            </button>
                          ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </section>
    </>
  );
}
