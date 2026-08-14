// Staff view of the Quinceañera Registration Form — /staff/registrations?key=…
//
// The site is static with no login, so the key in the URL is what proves staff.
// It is checked inside a security-definer function in Postgres, not here: this
// page only passes it along, and anon still cannot read the table directly.
//
// Deliberately a list of cards rather than a wide table. Most of these are read
// on a phone, and twenty columns of social handles is unreadable on one. The
// CSV button is there for anyone who wants a spreadsheet without waiting on the
// Google Sheet sync.

import { useEffect, useMemo, useState } from "react";
import { listQuinceRegistrations } from "../lib/quinceRegistration";
import type { QuinceRegistrationRow } from "../lib/quinceRegistration";
import Header from "./Header";
import Footer from "./Footer";
import Icon from "./Icon";

type State = "loading" | "denied" | "ready";

const CSV_COLUMNS: [string, (r: QuinceRegistrationRow) => string][] = [
  ["Submitted", (r) => new Date(r.created_at).toLocaleString()],
  ["First Name", (r) => r.first_name],
  ["Last Name", (r) => r.last_name],
  ["Cell Phone", (r) => r.cell_phone || ""],
  ["Email", (r) => r.email || ""],
  ["Sail Date", (r) => r.sail_date],
  ["Sit With", (r) => (r.sit_with ? "Yes" : "No")],
  ["Who With", (r) => r.sit_with_names || ""],
  ["Instagram", (r) => r.instagram || ""],
  ["Facebook", (r) => r.facebook || ""],
  ["TikTok", (r) => r.tiktok || ""],
  ["Snapchat", (r) => r.snapchat || ""],
  ["Favorite Social", (r) => r.favorite_social || ""],
  ["WhatsApp", (r) => (r.uses_whatsapp === undefined ? "" : r.uses_whatsapp ? "Yes" : "No")],
  ["High School", (r) => r.high_school || ""],
  ["Graduates", (r) => r.graduation_year || ""],
  ["On A Team", (r) => (r.on_team === undefined ? "" : r.on_team ? "Yes" : "No")],
  ["Team", (r) => r.team_name || ""],
  ["Parent", (r) => r.parent_name || ""],
  ["Parent Instagram", (r) => r.parent_instagram || ""],
  ["Invitation", (r) => r.invitation_slug || ""],
];

function toCsv(rows: QuinceRegistrationRow[]): string {
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [CSV_COLUMNS.map(([h]) => esc(h)).join(",")];
  for (const r of rows) lines.push(CSV_COLUMNS.map(([, f]) => esc(f(r))).join(","));
  return lines.join("\n");
}

/** One labelled value, hidden entirely when she left it blank. */
function Field({ label, value, href }: { label: string; value?: string; href?: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 break-words text-slate-800">
        {href ? (
          <a href={href} className="font-medium text-royal-600 hover:underline">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

export default function RegistrationsStaffPage() {
  const key = new URLSearchParams(window.location.search).get("key") ?? "";
  const [state, setState] = useState<State>("loading");
  const [rows, setRows] = useState<QuinceRegistrationRow[]>([]);
  const [q, setQ] = useState("");
  const [sail, setSail] = useState("");

  useEffect(() => {
    document.title = "Registrations | HHT Staff";
    if (!key) {
      setState("denied");
      return;
    }
    let cancelled = false;
    listQuinceRegistrations(key)
      .then((r) => {
        if (cancelled) return;
        setRows(r);
        setState("ready");
      })
      .catch(() => !cancelled && setState("denied"));
    return () => {
      cancelled = true;
    };
  }, [key]);

  const sailings = useMemo(
    () => [...new Set(rows.map((r) => r.sail_date))].sort(),
    [rows],
  );

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (sail && r.sail_date !== sail) return false;
      if (!needle) return true;
      return [
        r.first_name, r.last_name, r.cell_phone, r.email, r.high_school,
        r.instagram, r.tiktok, r.snapchat, r.parent_name, r.sit_with_names,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [rows, q, sail]);

  const downloadCsv = () => {
    const blob = new Blob([toCsv(shown)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quince-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (state === "loading") {
    return (
      <>
        <Header />
        <main className="px-5 py-20">
          <p role="status" className="text-center font-display text-2xl text-royal-800">
            Loading…
          </p>
        </main>
        <Footer />
      </>
    );
  }

  if (state === "denied") {
    return (
      <>
        <Header />
        <main className="px-5 py-20 text-center">
          <h1 className="font-display text-2xl font-semibold text-royal-800">Staff only</h1>
          <p className="mx-auto mt-3 max-w-md text-slate-600">
            This page needs the staff link. Use the one from the HHT Staff Information page — it
            includes the key.
          </p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold-600">
                Staff
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold text-royal-800">
                Quinceañera Registrations
              </h1>
              <p className="mt-1 text-slate-600">
                {rows.length} {rows.length === 1 ? "registration" : "registrations"}
                {shown.length !== rows.length ? ` · ${shown.length} shown` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={downloadCsv}
              className="rounded-full bg-royal-600 px-5 py-3 text-sm font-semibold text-white hover:bg-royal-700"
            >
              Download CSV
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, phone, school, socials…"
              className="w-full rounded-xl border border-blush-200 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-royal-400"
            />
            <select
              value={sail}
              onChange={(e) => setSail(e.target.value)}
              className="rounded-xl border border-blush-200 bg-white px-4 py-3 text-slate-800 focus:border-royal-400 sm:w-64"
            >
              <option value="">All sail dates</option>
              {sailings.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {shown.length === 0 ? (
            <p className="mt-12 text-center text-slate-500">
              {rows.length === 0
                ? "No registrations yet."
                : "Nothing matches that search."}
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {shown.map((r) => (
                <article
                  key={r.id}
                  className="rounded-3xl bg-white p-6 ring-1 ring-blush-200"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-display text-xl font-semibold text-royal-800">
                      {r.first_name} {r.last_name}
                    </h2>
                    <span className="text-sm text-slate-500">
                      {r.sail_date} · {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {r.sit_with && (
                    <p className="mt-3 flex items-start gap-2 rounded-xl bg-gold-100 p-3 text-sm text-royal-800 ring-1 ring-gold-200">
                      <Icon name="users" className="mt-0.5 h-4 w-4 flex-none" />
                      <span>
                        Wants to sit with{" "}
                        <strong>{r.sit_with_names || "another quinceañera (not named)"}</strong>
                      </span>
                    </p>
                  )}

                  <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                    <Field
                      label="Cell"
                      value={r.cell_phone}
                      href={r.cell_phone ? `tel:${r.cell_phone.replace(/\D/g, "")}` : undefined}
                    />
                    <Field
                      label="Email"
                      value={r.email}
                      href={r.email ? `mailto:${r.email}` : undefined}
                    />
                    <Field
                      label="WhatsApp"
                      value={r.uses_whatsapp === undefined ? "" : r.uses_whatsapp ? "Yes" : "No"}
                    />
                    <Field
                      label="Instagram"
                      value={r.instagram}
                      href={
                        r.instagram
                          ? `https://instagram.com/${r.instagram.replace(/^@/, "")}`
                          : undefined
                      }
                    />
                    <Field
                      label="TikTok"
                      value={r.tiktok}
                      href={
                        r.tiktok ? `https://tiktok.com/@${r.tiktok.replace(/^@/, "")}` : undefined
                      }
                    />
                    <Field label="Snapchat" value={r.snapchat} />
                    <Field label="Facebook" value={r.facebook} />
                    <Field label="Favorite social" value={r.favorite_social} />
                    <Field label="High school" value={r.high_school} />
                    <Field label="Graduates" value={r.graduation_year} />
                    <Field
                      label="Team"
                      value={
                        r.on_team === undefined
                          ? r.team_name
                          : r.on_team
                            ? r.team_name || "Yes"
                            : "No"
                      }
                    />
                    <Field label="Parent" value={r.parent_name} />
                    <Field
                      label="Parent Instagram"
                      value={r.parent_instagram}
                      href={
                        r.parent_instagram
                          ? `https://instagram.com/${r.parent_instagram.replace(/^@/, "")}`
                          : undefined
                      }
                    />
                    <Field
                      label="Invitation"
                      value={r.invitation_slug}
                      href={r.invitation_slug ? `/i/${r.invitation_slug}` : undefined}
                    />
                  </dl>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
