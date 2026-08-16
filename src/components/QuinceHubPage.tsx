// Her hub: /i/<slug>/hub — one link that holds everything she has.
//
// Deliberately small. Only the two invitations are live today; everything else
// is shown as Coming soon rather than hidden, so she can see what is on the way
// without being able to tap into something half-finished.
//
// If the URL carries ?key=<editKey>, the edit link is offered too — that key is
// the same secret the family editor needs, so the hub link doubles as her one
// private link.

import { useEffect, useState } from "react";
import { invitation } from "../data/invitation";
import { fetchInvitationRow } from "../lib/liveInvitation";
import { hasRegistered } from "../lib/quinceRegistration";
import type { InvitationRow } from "../lib/liveInvitation";
import Header from "./Header";
import Footer from "./Footer";
import Icon from "./Icon";

type PageState = "loading" | "missing" | "ready";

interface Tool {
  icon: string;
  title: string;
  body: string;
  href?: string;
  cta?: string;
  soon?: boolean;
  /** Highlighted at the top until she has done it. */
  todo?: boolean;
  done?: boolean;
}

export default function QuinceHubPage({ slug }: { slug: string }) {
  const editKey = new URLSearchParams(window.location.search).get("key") ?? "";
  const [state, setState] = useState<PageState>("loading");
  const [row, setRow] = useState<InvitationRow | null>(null);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchInvitationRow(slug)
      .then((r) => {
        if (cancelled) return;
        if (!r) {
          setState("missing");
          return;
        }
        setRow(r);
        document.title = `${r.preferred_name}'s Quinceañera Hub`;
        setState("ready");
        // Decides whether the registration card sits at the top or drops
        // down to the bottom as a done item.
        hasRegistered(slug).then((yes) => !cancelled && setRegistered(yes));
      })
      .catch(() => !cancelled && setState("missing"));
    return () => {
      cancelled = true;
    };
  }, [slug]);

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

  if (state === "missing" || !row) {
    return (
      <>
        <Header />
        <main className="px-5 py-20 text-center">
          <p className="font-display text-2xl font-semibold text-royal-800">
            We could not find this hub.
          </p>
          <p className="mt-3 text-slate-600">
            Please check the link, or call Happy Holidays Travel at{" "}
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

  const s = encodeURIComponent(slug);
  const registration: Tool = {
    icon: "crown",
    title: "Quinceañera Registration Form",
    body: registered
      ? "Thank you — we have your details. Need to change something? Fill it in again and tell us."
      : "Start here. Tell us about you: how to reach you, who you want to sit with at dinner, your school and your socials.",
    href: `/i/${s}/register`,
    cta: registered ? "Fill it in again" : "Start my registration",
    todo: !registered,
    done: registered,
  };

  const rest: Tool[] = [
    {
      icon: "sparkles",
      title: "My invitation",
      body: "The invitation your family and guests see, with your photo, your message and everything about the cruise.",
      href: `/i/${s}`,
      cta: "View my invitation",
    },
    ...(editKey
      ? [
          {
            icon: "heart",
            title: "Edit my invitation",
            body: "Change your photo, your welcome message and how the photo is framed. Your changes appear instantly.",
            href: `/i/${s}/edit?key=${encodeURIComponent(editKey)}`,
            cta: "Edit",
          } as Tool,
        ]
      : []),
    {
      icon: "ship",
      title: "Invite my friends",
      body: "Ask your friends to have their quinceañera with you. Send it by text, email or WhatsApp with the message already written.",
      href: `/i/${s}/friends`,
      cta: "Invite friends",
    },
    ...(row.group_code
      ? [
          {
            icon: "users",
            title: "Invitation for your family's friends",
            body: "For the grown-ups sailing with you. It invites people to the cruise without mentioning your quinces, so your aunts and uncles can send it to their own friends and fill more cabins.",
            href: `/c/${row.group_code}`,
            cta: "Open the group invitation",
          } as Tool,
        ]
      : []),
    {
      icon: "camera",
      title: "Cruise photos",
      body: "Upload photos and videos from the cruise, and share your album with your family.",
      soon: true,
    },
    {
      icon: "gift",
      title: "Gift registry",
      body: "Your registry, so guests know exactly what would make your quinces special.",
      soon: true,
    },
    {
      icon: "ship",
      title: "Excursions",
      body: "Choose what you want to do in each port before you sail.",
      soon: true,
    },
    {
      icon: "info",
      title: "Quinces video",
      body: "The video that explains how a quinceañera cruise works, to share with your family.",
      soon: true,
    },
  ];

  // Not done yet, so it leads. Once she has registered it drops to the bottom
  // and the invitations become the first thing she sees.
  const tools = registered ? [...rest, registration] : [registration, ...rest];

  return (
    <>
      <Header />
      <main className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold-600">
              Quinceañera Hub
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold text-royal-800 sm:text-4xl">
              {row.preferred_name}’s quinces, all in one place
            </h1>
            <p className="mt-3 text-slate-600">
              {row.ship ? `Sailing aboard the ${row.ship}` : "Your quinceañera cruise"}
              {row.sailing_dates ? ` · ${row.sailing_dates}` : ""}. Bookmark this page — everything
              we build for you shows up here.
            </p>
          </div>

          <div className="mt-9 space-y-4">
            {tools.map((t) => {
              const inner = (
                <>
                  <span
                    className={`inline-flex flex-none rounded-full p-3 ${
                      t.soon ? "bg-slate-200 text-slate-500" : "bg-royal-600 text-white"
                    }`}
                  >
                    <Icon name={t.icon} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span
                        className={`font-display text-xl font-semibold ${
                          t.soon ? "text-slate-500" : "text-royal-800"
                        }`}
                      >
                        {t.title}
                      </span>
                      {t.soon && (
                        <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600">
                          Coming soon
                        </span>
                      )}
                      {t.todo && (
                        <span className="rounded-full bg-royal-600 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                          Start here
                        </span>
                      )}
                      {t.done && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                          Done
                        </span>
                      )}
                    </span>
                    <span
                      className={`mt-1 block leading-relaxed ${
                        t.soon ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      {t.body}
                    </span>
                    {!t.soon && t.cta && (
                      <span className="mt-2 inline-block font-semibold text-royal-600">
                        {t.cta} →
                      </span>
                    )}
                  </span>
                </>
              );

              if (t.done) {
                return (
                  <a key={t.title} href={t.href}
                    className="flex gap-4 rounded-3xl bg-white p-6 ring-1 ring-blush-200 transition hover:ring-royal-300">
                    {inner}
                  </a>
                );
              }
              if (t.todo) {
                return (
                  <a key={t.title} href={t.href}
                    className="flex gap-4 rounded-3xl bg-royal-50 p-6 ring-2 ring-royal-400 transition hover:ring-royal-500">
                    {inner}
                  </a>
                );
              }
              return t.soon ? (
                <div
                  key={t.title}
                  className="flex gap-4 rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200"
                >
                  {inner}
                </div>
              ) : (
                <a
                  key={t.title}
                  href={t.href}
                  className="flex gap-4 rounded-3xl bg-blush-50 p-6 ring-1 ring-blush-200 transition hover:ring-royal-300"
                >
                  {inner}
                </a>
              );
            })}
          </div>

          <div className="mt-10 rounded-3xl bg-royal-800 p-7 text-center">
            <p className="font-display text-xl font-semibold text-white">Questions about anything?</p>
            <p className="mt-2 text-blush-100">
              {row.agent_name ? `Ask ${row.agent_name}` : "Call Happy Holidays Travel"} — we are
              here the whole way.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href={`tel:+${(row.agent_phone || invitation.office.phoneDial).replace(/\D/g, "")}`}
                className="rounded-full bg-white px-6 py-3 font-semibold text-royal-800 hover:bg-blush-50"
              >
                Call {row.agent_phone || invitation.office.phoneDisplay}
              </a>
              {row.agent_whatsapp && (
                <a
                  href={`https://wa.me/${row.agent_whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener"
                  className="rounded-full bg-white/10 px-6 py-3 font-semibold text-white ring-1 ring-white/40 hover:bg-white/20"
                >
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
