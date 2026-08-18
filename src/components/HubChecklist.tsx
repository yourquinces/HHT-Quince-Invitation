// Her checklist, at the top of the hub.
//
// Two kinds of item, and the distinction is deliberate:
//
//   Earned  — the registration form and the ship visit. We can see whether she
//             has done these, so they turn green on their own and she cannot
//             tick them. A box you can tick without doing the thing is a
//             to-do list, not progress.
//   Ticked  — WhatsApp, Instagram, X, and the two invitations. Nothing on our
//             side can see these, so they are hers to mark, and hers to undo.
//
// Ticking needs the secret key from her private link. Opened without it the
// list still shows, read-only, which is the right answer for a page a family
// might share around.

import { useState } from "react";
import { setChecklistItem } from "../lib/liveInvitation";
import type { HubProgress } from "../lib/liveInvitation";
import Icon from "./Icon";

interface Item {
  key: string;
  title: string;
  body: string;
  icon: string;
  href?: string;
  cta?: string;
  /** Set for items we can verify; those are never tickable by hand. */
  earned?: boolean;
}

export default function HubChecklist({
  slug, editKey, progress, groupCode, whatsappUrl, onChange,
}: {
  slug: string;
  editKey: string;
  progress: HubProgress;
  groupCode?: string | null;
  whatsappUrl?: string;
  onChange: (next: HubProgress) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const s = encodeURIComponent(slug);

  const items: Item[] = [
    {
      key: "registration",
      title: "Fill in your registration form",
      body: "How to reach you, who you want to sit with at dinner, your school and your socials.",
      icon: "crown",
      href: `/i/${s}/register`,
      cta: "Start my registration",
      earned: progress.registered,
    },
    {
      key: "shipvisit",
      title: "Sign up for a ship visit",
      body: "Come aboard and see the ship before you sail. Bring photo ID for everyone coming.",
      icon: "ship",
      href: `/ship-visit?slug=${s}`,
      cta: "Register for a visit",
      earned: progress.ship_visit,
    },
    {
      key: "whatsapp",
      title: "Join the WhatsApp group",
      body: whatsappUrl
        ? "Where we post updates, plans and everything as the cruise gets closer."
        : "Ask your agent for the group link — we will add you.",
      icon: "phone",
      href: whatsappUrl || undefined,
      cta: "Join the group",
    },
    {
      key: "instagram",
      title: "Follow @hhtcruises on Instagram",
      body: "Photos from every sailing, and the first word on new dates.",
      icon: "camera",
      href: "https://instagram.com/hhtcruises",
      cta: "Open Instagram",
    },
    {
      key: "x",
      title: "Follow @hhtcruises on X",
      body: "The same news, if X is where you already are.",
      icon: "sparkles",
      href: "https://x.com/hhtcruises",
      cta: "Open X",
    },
    {
      key: "friends",
      title: "Invite a friend to have her quinces with you",
      body: "Ask a friend to celebrate hers on the same cruise — one week, both parties.",
      icon: "heart",
      href: `/i/${s}/friends`,
      cta: "Invite a friend",
    },
    {
      key: "family",
      title: "Invite your family and friends to the cruise",
      body: groupCode
        ? "The invitation for everyone else — the cruise, the prices and how to book."
        : "Ask your agent for the invitation to send your family.",
      icon: "users",
      href: groupCode ? `/c/${groupCode}` : undefined,
      cta: "Open the invitation",
    },
  ];

  const isDone = (i: Item) => (i.earned !== undefined ? i.earned : !!progress.checklist[i.key]);
  const doneCount = items.filter(isDone).length;
  const allDone = doneCount === items.length;

  async function toggle(item: Item) {
    if (item.earned !== undefined || !editKey) return;
    const next = !progress.checklist[item.key];
    setBusy(item.key);
    setError("");
    // Shown ticked immediately; put back if the save fails.
    onChange({ ...progress, checklist: { ...progress.checklist, [item.key]: next } });
    try {
      const ok = await setChecklistItem(slug, editKey, item.key, next);
      if (!ok) throw new Error("key");
    } catch {
      onChange({ ...progress, checklist: { ...progress.checklist, [item.key]: !next } });
      setError("That did not save. Check you opened this page from your own link.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mt-9 rounded-2xl bg-white p-5 ring-1 ring-blush-200 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl font-bold text-royal-800">Your checklist</h2>
        <span className={`text-sm font-semibold ${allDone ? "text-emerald-600" : "text-slate-500"}`}>
          {allDone ? "All done — nice work!" : `${doneCount} of ${items.length} done`}
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-blush-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-emerald-500" : "bg-royal-500"}`}
          style={{ width: `${(doneCount / items.length) * 100}%` }}
        />
      </div>

      {error && <p role="alert" className="mt-3 text-sm font-medium text-rosa-600">{error}</p>}

      <ul className="mt-5 space-y-2.5">
        {items.map((item) => {
          const done = isDone(item);
          const canTick = item.earned === undefined && !!editKey;
          return (
            <li
              key={item.key}
              className={`flex items-start gap-3 rounded-xl p-3 transition ${
                done ? "bg-emerald-50/60" : "bg-blush-50/50"
              }`}
            >
              {/* Blue while it is waiting, green once it is done. */}
              <button
                type="button"
                onClick={() => toggle(item)}
                disabled={!canTick || busy === item.key}
                aria-pressed={done}
                aria-label={
                  item.earned !== undefined
                    ? `${item.title} — ${done ? "done" : "not done yet"}`
                    : `Mark "${item.title}" as ${done ? "not done" : "done"}`
                }
                title={
                  item.earned !== undefined
                    ? "This ticks itself once we have your details"
                    : canTick
                      ? "Tap when you have done it"
                      : "Open your hub from your own link to tick this"
                }
                className={`mt-0.5 inline-flex h-10 w-10 flex-none items-center justify-center rounded-full text-white transition ${
                  done ? "bg-emerald-500" : "bg-royal-600"
                } ${canTick ? "cursor-pointer hover:brightness-110" : "cursor-default"} ${
                  busy === item.key ? "opacity-60" : ""
                }`}
              >
                <Icon name={done ? "check" : item.icon} className="h-5 w-5" />
              </button>

              <div className="min-w-0 flex-1">
                <p className={`font-semibold ${done ? "text-emerald-800" : "text-royal-800"}`}>
                  {item.title}
                </p>
                <p className="mt-0.5 text-sm text-slate-600">{item.body}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm">
                  {item.href && (
                    <a
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noopener" : undefined}
                      className="font-semibold text-royal-600 hover:text-royal-700"
                    >
                      {item.cta} →
                    </a>
                  )}
                  {item.earned !== undefined ? (
                    <span className="text-xs text-slate-400">
                      {done ? "We have this — ticked for you" : "Ticks itself once we have it"}
                    </span>
                  ) : canTick ? (
                    <button
                      type="button"
                      onClick={() => toggle(item)}
                      disabled={busy === item.key}
                      className="text-xs font-medium text-slate-400 hover:text-royal-600"
                    >
                      {done ? "Not done after all" : "Mark as done"}
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
