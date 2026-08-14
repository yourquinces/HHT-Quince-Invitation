// Staff directory of every girl's links — /staff/hubs?key=…
//
// There is no single "hub" URL: every hub belongs to one quinceañera. This is
// the page that turns that into something usable, listing each girl with all
// her links in one row, and a copy button for the private hub link — the one
// that carries her edit key and therefore unlocks editing too.
//
// Same shared key as the registrations view, checked inside a security-definer
// function. invitation_edit_keys is authenticated-only, so the keys can only
// reach here through that function.

import { useEffect, useMemo, useState } from "react";
import { SUPABASE_URL, SUPABASE_KEY } from "../lib/supabase";
import Header from "./Header";
import Footer from "./Footer";

type State = "loading" | "denied" | "ready";

interface Row {
  slug: string;
  quinceanera_name: string;
  preferred_name: string;
  ship: string | null;
  sailing_dates: string | null;
  sail_date: string | null;
  edit_key: string | null;
  registered: boolean;
}

const linkCls =
  "rounded-full border border-blush-200 bg-white px-3 py-1.5 text-xs font-semibold text-royal-700 hover:border-royal-400 hover:text-royal-800";

export default function HubsStaffPage() {
  const key = new URLSearchParams(window.location.search).get("key") ?? "";
  const [state, setState] = useState<State>("loading");
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    document.title = "Quinceañera Hubs | HHT Staff";
    if (!key) {
      setState("denied");
      return;
    }
    let cancelled = false;
    fetch(`${SUPABASE_URL}/rest/v1/rpc/list_invitation_links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ p_key: key }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Row[]) => {
        if (cancelled) return;
        setRows(data);
        setState("ready");
      })
      .catch(() => !cancelled && setState("denied"));
    return () => {
      cancelled = true;
    };
  }, [key]);

  const bySail = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const hit = rows.filter(
      (r) =>
        !needle ||
        `${r.quinceanera_name} ${r.preferred_name} ${r.slug} ${r.ship ?? ""}`
          .toLowerCase()
          .includes(needle),
    );
    const map = new Map<string, Row[]>();
    for (const r of hit) {
      const k = r.sailing_dates || r.sail_date || "Sailing not set";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    return [...map.entries()];
  }, [rows, q]);

  const origin = window.location.origin;
  /** Her one private link: the hub, carrying the edit key so editing works. */
  const privateHub = (r: Row) =>
    `${origin}/i/${encodeURIComponent(r.slug)}/hub${
      r.edit_key ? `?key=${encodeURIComponent(r.edit_key)}` : ""
    }`;

  const copy = async (r: Row) => {
    try {
      await navigator.clipboard.writeText(privateHub(r));
      setCopied(r.slug);
      setTimeout(() => setCopied(""), 2200);
    } catch {
      setCopied("");
    }
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
            This page needs the staff link. Use the one on the HHT Staff Information page — it
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
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold-600">Staff</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-royal-800">
            Quinceañera Hubs
          </h1>
          <p className="mt-1 text-slate-600">
            {rows.length} active {rows.length === 1 ? "invitation" : "invitations"}. “Copy her
            link” gives the private hub link — send her that one and everything else is inside it.
          </p>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, slug or ship…"
            className="mt-6 w-full rounded-xl border border-blush-200 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-royal-400"
          />

          {bySail.length === 0 ? (
            <p className="mt-12 text-center text-slate-500">
              {rows.length === 0 ? "No active invitations yet." : "Nothing matches that search."}
            </p>
          ) : (
            bySail.map(([sailing, list]) => (
              <section key={sailing} className="mt-8">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {sailing} · {list.length} {list.length === 1 ? "girl" : "girls"}
                </h2>
                <div className="space-y-3">
                  {list.map((r) => (
                    <article
                      key={r.slug}
                      className="rounded-2xl bg-white p-5 ring-1 ring-blush-200"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="font-display text-xl font-semibold text-royal-800">
                          {r.quinceanera_name}
                        </h3>
                        <span className="flex items-center gap-2 text-xs text-slate-500">
                          {r.ship}
                          {r.registered ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-bold uppercase tracking-[0.1em] text-emerald-700">
                              Registered
                            </span>
                          ) : (
                            <span className="rounded-full bg-gold-100 px-2 py-0.5 font-bold uppercase tracking-[0.1em] text-royal-800">
                              No form yet
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => copy(r)}
                          className="rounded-full bg-royal-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-royal-700"
                        >
                          {copied === r.slug ? "Copied!" : "Copy her link"}
                        </button>
                        <a className={linkCls} href={privateHub(r)} target="_blank" rel="noopener">
                          Hub
                        </a>
                        <a className={linkCls} href={`/i/${r.slug}`} target="_blank" rel="noopener">
                          Invitation
                        </a>
                        <a
                          className={linkCls}
                          href={`/i/${r.slug}/friends`}
                          target="_blank"
                          rel="noopener"
                        >
                          Invite friends
                        </a>
                        <a
                          className={linkCls}
                          href={`/i/${r.slug}/register`}
                          target="_blank"
                          rel="noopener"
                        >
                          Registration
                        </a>
                        {r.edit_key && (
                          <a
                            className={linkCls}
                            href={`/i/${r.slug}/edit?key=${r.edit_key}`}
                            target="_blank"
                            rel="noopener"
                          >
                            Edit photo &amp; message
                          </a>
                        )}
                      </div>

                      {!r.edit_key && (
                        <p className="mt-3 text-xs text-rosa-600">
                          No edit key on file, so she cannot change her photo or message. Add a row
                          to invitation_edit_keys for this invitation.
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
