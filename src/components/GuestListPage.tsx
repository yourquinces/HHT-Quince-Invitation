// Her guest list — /i/<slug>/guests?key=<editKey>
//
// Everyone booked under her, read live from the reservation system, so it is
// always what the office has rather than a copy that drifts. Read-only on
// purpose: bookings are made by agents, and a list she could edit would only
// disagree with them.
//
// It needs the secret key from her private hub link, because it names other
// families. Money, phone numbers and addresses are never returned by the
// function behind it — she is being told who is coming, not shown the books.

import { useEffect, useMemo, useState } from "react";
import { invitation } from "../data/invitation";
import { fetchQuinceGuests } from "../lib/liveInvitation";
import type { GuestCabin, GuestList } from "../lib/liveInvitation";
import Header from "./Header";
import Footer from "./Footer";
import Icon from "./Icon";

type PageState = "loading" | "denied" | "error" | "ready";

/** Agents put TBD in a seat that is booked but not yet named. */
function guestName(first: string | null, last: string | null): string | null {
  const parts = [first, last]
    .map((p) => (p || "").trim())
    .filter((p) => p && p.toUpperCase() !== "TBD");
  if (!parts.length) return null;
  return parts
    .join(" ")
    .toLowerCase()
    .replace(/\b[a-záéíóúñü]/g, (c) => c.toUpperCase());
}

/** "2026-08-02" → "August 2, 2026". Parsed as local so it never shows the day before. */
function prettyDate(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!y || !m || !d) return String(iso);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function cabinLabel(c: GuestCabin): string {
  return c.cabin_number ? `Cabin ${c.cabin_number}` : "Cabin not assigned yet";
}

export default function GuestListPage({ slug }: { slug: string }) {
  const key = new URLSearchParams(window.location.search).get("key") ?? "";
  const [state, setState] = useState<PageState>("loading");
  const [data, setData] = useState<GuestList | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    document.title = "Guest List";
    if (!key) {
      setState("denied");
      return;
    }
    let cancelled = false;
    fetchQuinceGuests(slug, key)
      .then((rows) => {
        if (cancelled) return;
        if (!rows) {
          setState("denied");
          return;
        }
        setData(rows);
        document.title = `${rows.quinceanera ?? "Guest"} — Guest List`;
        setState("ready");
      })
      .catch(() => !cancelled && setState("error"));
    return () => {
      cancelled = true;
    };
  }, [slug, key]);

  const totals = useMemo(() => {
    if (!data) return { guests: 0, cabins: 0, named: 0 };
    const guests = data.cabins.reduce((s, c) => s + c.guests.length, 0);
    const named = data.cabins.reduce(
      (s, c) => s + c.guests.filter((g) => guestName(g.first_name, g.last_name)).length,
      0,
    );
    return { guests, cabins: data.cabins.length, named };
  }, [data]);

  const cabins = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return data.cabins;
    return data.cabins.filter((c) => {
      if ((c.cabin_number || "").toLowerCase().includes(needle)) return true;
      return c.guests.some((g) =>
        `${g.first_name ?? ""} ${g.last_name ?? ""}`.toLowerCase().includes(needle),
      );
    });
  }, [data, q]);

  if (state === "loading") {
    return (
      <>
        <Header />
        <main className="px-5 py-20">
          <p role="status" className="text-center font-display text-2xl text-royal-800">
            Loading your guest list…
          </p>
        </main>
        <Footer />
      </>
    );
  }

  if (state === "denied" || state === "error") {
    return (
      <>
        <Header />
        <main className="px-5 py-20 text-center">
          <p className="font-display text-2xl font-semibold text-royal-800">
            {state === "denied" ? "This page needs your private link" : "We could not load your guest list"}
          </p>
          <p className="mx-auto mt-3 max-w-md text-slate-600">
            {state === "denied"
              ? "Your guest list opens from the private link Happy Holidays Travel sent you — the one that also lets you edit your invitation. Open your hub from that link and tap Guest list."
              : "Please try again in a moment."}{" "}
            Need it resent? Call us at{" "}
            <a href={`tel:+${invitation.office.phoneDial}`} className="font-medium text-royal-600">
              {invitation.office.phoneDisplay}
            </a>
            .
          </p>
        </main>
        <Footer />
      </>
    );
  }

  const unnamed = totals.guests - totals.named;

  return (
    <>
      <Header />
      <main className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold-600">
              Guest List
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold text-royal-800 sm:text-4xl">
              Who is sailing with {data?.quinceanera ?? "you"}
            </h1>
            <p className="mt-3 text-slate-600">
              {data?.ship ? `Aboard the ${data.ship}` : "Your cruise"}
              {data?.sail_date ? ` · sailing ${prettyDate(data.sail_date)}` : ""}. Straight from the reservation
              system, so it updates as cabins are booked.
            </p>
          </div>

          {/* The two numbers she actually wants */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:mx-auto sm:max-w-md">
            <div className="rounded-2xl bg-blush-50 px-5 py-4 text-center ring-1 ring-blush-200">
              <div className="font-display text-3xl font-bold text-royal-800">{totals.guests}</div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {totals.guests === 1 ? "Guest" : "Guests"}
              </div>
            </div>
            <div className="rounded-2xl bg-blush-50 px-5 py-4 text-center ring-1 ring-blush-200">
              <div className="font-display text-3xl font-bold text-royal-800">{totals.cabins}</div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {totals.cabins === 1 ? "Cabin" : "Cabins"}
              </div>
            </div>
          </div>

          {unnamed > 0 && (
            <p className="mt-4 text-center text-sm text-slate-500">
              {unnamed} {unnamed === 1 ? "seat is" : "seats are"} booked but not named yet — the
              family has the cabin and will tell us who is in it.
            </p>
          )}

          {totals.cabins > 3 && (
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a name or cabin…"
              className="mt-7 w-full rounded-xl border border-blush-200 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-royal-400"
            />
          )}

          {cabins.length === 0 ? (
            <p className="mt-12 text-center text-slate-500">
              {data && data.cabins.length === 0
                ? "No cabins booked under your name yet. As your family and friends book, they will appear here."
                : "Nothing matches that search."}
            </p>
          ) : (
            <div className="mt-6 space-y-3">
              {cabins.map((c, i) => (
                <section
                  key={`${c.cabin_number ?? "none"}-${i}`}
                  className={`rounded-2xl bg-white p-5 ring-1 ${
                    c.is_quinceanera ? "ring-rosa-300" : "ring-blush-200"
                  }`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-display text-xl font-semibold text-royal-800">
                      {cabinLabel(c)}
                      {c.is_quinceanera && (
                        <span className="ml-2 rounded-full bg-rosa-100 px-2.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-[0.12em] text-rosa-600">
                          Yours
                        </span>
                      )}
                    </h2>
                    <span className="text-xs text-slate-500">
                      {c.guests.length} {c.guests.length === 1 ? "guest" : "guests"}
                      {c.occupancy ? ` · ${c.occupancy.toLowerCase()}` : ""}
                    </span>
                  </div>

                  <ul className="mt-3 space-y-1.5">
                    {c.guests.map((g, gi) => {
                      const name = guestName(g.first_name, g.last_name);
                      return (
                        <li key={gi} className="flex items-center gap-2.5 text-slate-700">
                          <span
                            className={`inline-flex h-6 w-6 flex-none items-center justify-center rounded-full ${
                              g.is_quinceanera ? "bg-rosa-500 text-white" : "bg-blush-100 text-royal-600"
                            }`}
                          >
                            <Icon name={g.is_quinceanera ? "crown" : "users"} className="h-3.5 w-3.5" />
                          </span>
                          <span className={name ? "" : "italic text-slate-400"}>
                            {name ?? "Name to come"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}

          <p className="mt-8 text-center text-sm text-slate-500">
            Someone missing? They may not have booked yet, or booked without mentioning your
            group — call us at{" "}
            <a href={`tel:+${invitation.office.phoneDial}`} className="font-medium text-royal-600">
              {invitation.office.phoneDisplay}
            </a>{" "}
            and we will check.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
