// "Let's celebrate our quinces together" — the page a quinceañera sends to her
// friends at /i/<slug>/friends.
//
// Deliberately has NO prices. Its only job is to get an interested friend to
// raise her hand, so the one call to action is a short form into the existing
// quince_leads pipeline, tagged with who referred her. Everything about money
// is a conversation for the agent.
//
// The share row at the bottom is for the quinceañera herself — email, text and
// WhatsApp all open with the message already written, because a fifteen-year-old
// forwarding a link should not have to compose anything.

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { invitation } from "../data/invitation";
import { shipPhotos } from "../data/sailings";
import { fetchInvitationRow } from "../lib/liveInvitation";
import type { InvitationRow } from "../lib/liveInvitation";
import { submitQuinceLead } from "../lib/quinceLeads";
import Header from "./Header";
import Footer from "./Footer";
import Icon from "./Icon";
import PrimaryButton from "./PrimaryButton";

type PageState = "loading" | "missing" | "ready";
type Status = "idle" | "submitting" | "success" | "error";

const inputClass =
  "w-full rounded-xl border border-blush-200 bg-white px-4 py-3.5 text-slate-800 placeholder:text-slate-400 focus:border-royal-400";
const labelClass = "mb-1.5 block text-sm font-semibold text-royal-800";

const REASONS = [
  {
    icon: "sparkles",
    title: "One celebration, together",
    body: "Instead of two separate parties, you both get one unforgettable week at sea — with your families and friends all in the same place.",
  },
  {
    icon: "ship",
    title: "The party is the whole trip",
    body: "A formal quinces night, a welcome party, photo sessions, beaches and islands. Not one evening in a hall — days of it.",
  },
  {
    icon: "heart",
    title: "Split the fuss, not the memories",
    body: "Happy Holidays Travel handles the planning, the group booking and the payment plans for both families.",
  },
];

export default function FriendInvitePage({ slug }: { slug: string }) {
  const [state, setState] = useState<PageState>("loading");
  const [row, setRow] = useState<InvitationRow | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [fields, setFields] = useState({
    friendFirst: "",
    parentFirst: "",
    parentPhone: "",
    parentEmail: "",
    notes: "",
    botField: "",
  });
  const [copied, setCopied] = useState(false);

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
        document.title = `${r.preferred_name} wants you to celebrate your quinces together`;
        setState("ready");
      })
      .catch(() => !cancelled && setState("missing"));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const name = row?.preferred_name ?? "";
  const heroImage =
    row?.hero_image_url || (row?.ship && shipPhotos(row.ship)?.hero) || invitation.hero.image;

  const shareUrl = useMemo(
    () => `${window.location.origin}/i/${encodeURIComponent(slug)}/friends`,
    [slug],
  );
  const shareText = useMemo(
    () =>
      `${name} here! I'm having my quinceañera on a cruise and I want you to do yours with me — let's celebrate our quinces together. Take a look:`,
    [name],
  );

  const set = (k: keyof typeof fields, v: string) => setFields((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;
    if (fields.botField) return; // honeypot
    setStatus("submitting");
    try {
      await submitQuinceLead({
        quince_first: fields.friendFirst,
        parent_first: fields.parentFirst || fields.friendFirst,
        parent_email: fields.parentEmail,
        parent_phone: fields.parentPhone,
        interest: row?.ship ? [row.ship] : undefined,
        heard_about: `Invited by ${row?.quinceanera_name ?? name}`,
        client_notes:
          [
            `Friend invitation from ${row?.quinceanera_name ?? name} (${slug}).`,
            row?.sailing_dates ? `Her sailing: ${row.sailing_dates}.` : "",
            fields.notes,
          ]
            .filter(Boolean)
            .join(" "),
        source: "friend-invite",
        source_url: shareUrl,
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
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

  if (state === "missing" || !row) {
    return (
      <>
        <Header />
        <main className="px-5 py-20 text-center">
          <p className="font-display text-2xl font-semibold text-royal-800">
            We could not find this invitation.
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

  return (
    <>
      <Header />
      <main>
        {/* ---------- Invitation from her ---------- */}
        <section className="px-5 py-12 sm:px-8 sm:py-16">
          <div className="mx-auto grid max-w-5xl items-center gap-10 sm:grid-cols-2">
            <div className="order-2 sm:order-1">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold-600">
                An invitation from {name}
              </p>
              <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-royal-800 sm:text-5xl">
                Let’s celebrate our quinces together
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-slate-600">
                I’m having my quinceañera on a cruise
                {row.sailing_dates ? ` — ${row.sailing_dates}` : ""}
                {row.ship ? `, aboard the ${row.ship}` : ""}. I’d love for you to have yours with
                me, so we celebrate together instead of apart.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                Have your mom or dad send their number below and Happy Holidays Travel will explain
                how it works — no pressure, just a conversation.
              </p>
              <div className="mt-7">
                <PrimaryButton href="#friend-form">Tell me more</PrimaryButton>
              </div>
            </div>
            <div className="order-1 sm:order-2">
              <div className="overflow-hidden rounded-3xl shadow-xl ring-1 ring-blush-200">
                <img
                  src={heroImage}
                  alt={
                    row.hero_image_url
                      ? `${name}, celebrating her quinceañera`
                      : `${row.ship ?? "A Royal Caribbean ship"} at sea`
                  }
                  className="aspect-[4/5] w-full object-cover"
                  style={{ objectPosition: row.hero_image_url ? row.image_position || "center top" : "center" }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Why ---------- */}
        <section className="bg-blush-50 px-5 py-14 sm:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-display text-3xl font-bold text-royal-800">
              Why do it together
            </h2>
            <div className="mt-9 grid gap-6 sm:grid-cols-3">
              {REASONS.map((r) => (
                <div key={r.title} className="rounded-3xl bg-white p-6 ring-1 ring-blush-200">
                  <span className="inline-flex rounded-full bg-royal-600 p-3 text-white">
                    <Icon name={r.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-xl font-semibold text-royal-800">
                    {r.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-slate-600">{r.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- The one call to action ---------- */}
        <section id="friend-form" className="px-5 py-14 sm:px-8">
          <div className="mx-auto max-w-2xl">
            {status === "success" ? (
              <div className="rounded-3xl bg-blush-50 p-8 text-center ring-1 ring-blush-200">
                <span className="inline-flex rounded-full bg-royal-600 p-3 text-white">
                  <Icon name="check" className="h-6 w-6" />
                </span>
                <p className="mt-4 font-display text-2xl font-semibold text-royal-800">
                  Thank you! We’ll be in touch soon.
                </p>
                <p className="mt-2 text-slate-600">
                  Someone from Happy Holidays Travel will reach out to talk it through. If you’d
                  rather not wait, call us at{" "}
                  <a
                    href={`tel:+${invitation.office.phoneDial}`}
                    className="font-medium text-royal-600"
                  >
                    {invitation.office.phoneDisplay}
                  </a>
                  .
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-center font-display text-3xl font-bold text-royal-800">
                  Interested? Let’s talk.
                </h2>
                <p className="mt-3 text-center text-slate-600">
                  Leave your parent’s details and we’ll call to explain everything — dates, cabins
                  and payment plans included.
                </p>
                <form
                  onSubmit={handleSubmit}
                  className="mt-8 space-y-5 rounded-3xl bg-blush-50 p-6 ring-1 ring-blush-200 sm:p-8"
                >
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={fields.botField}
                    onChange={(e) => set("botField", e.target.value)}
                    className="hidden"
                    aria-hidden="true"
                  />
                  <div>
                    <label htmlFor="fi-quince" className={labelClass}>
                      Your name (the quinceañera)
                    </label>
                    <input
                      id="fi-quince"
                      required
                      value={fields.friendFirst}
                      onChange={(e) => set("friendFirst", e.target.value)}
                      className={inputClass}
                      placeholder="Sofia"
                    />
                  </div>
                  <div>
                    <label htmlFor="fi-parent" className={labelClass}>
                      Your mom or dad’s name
                    </label>
                    <input
                      id="fi-parent"
                      value={fields.parentFirst}
                      onChange={(e) => set("parentFirst", e.target.value)}
                      className={inputClass}
                      placeholder="Ana"
                    />
                  </div>
                  <div>
                    <label htmlFor="fi-phone" className={labelClass}>
                      Best phone number
                    </label>
                    <input
                      id="fi-phone"
                      type="tel"
                      required
                      value={fields.parentPhone}
                      onChange={(e) => set("parentPhone", e.target.value)}
                      className={inputClass}
                      placeholder="(305) 555-1234"
                    />
                  </div>
                  <div>
                    <label htmlFor="fi-email" className={labelClass}>
                      Email
                    </label>
                    <input
                      id="fi-email"
                      type="email"
                      required
                      value={fields.parentEmail}
                      onChange={(e) => set("parentEmail", e.target.value)}
                      className={inputClass}
                      placeholder="ana@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="fi-notes" className={labelClass}>
                      Anything you’d like us to know{" "}
                      <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <textarea
                      id="fi-notes"
                      rows={3}
                      value={fields.notes}
                      onChange={(e) => set("notes", e.target.value)}
                      className={inputClass}
                      placeholder="When her quinceañera is, questions, anything at all"
                    />
                  </div>

                  {status === "error" && (
                    <div
                      role="alert"
                      className="rounded-xl bg-rosa-100 p-4 text-sm text-rosa-600 ring-1 ring-rosa-200"
                    >
                      Something went wrong sending that. Please try again, or call us at{" "}
                      {invitation.office.phoneDisplay}.
                    </div>
                  )}

                  <PrimaryButton
                    type="submit"
                    disabled={status === "submitting"}
                    className="w-full sm:w-full"
                  >
                    {status === "submitting" ? "Sending…" : "Have Happy Holidays Travel call me"}
                  </PrimaryButton>
                  <p className="text-center text-xs text-slate-500">
                    Or call {invitation.office.phoneDisplay} — ask about {name}’s cruise.
                  </p>
                </form>
              </>
            )}
          </div>
        </section>

        {/* ---------- Share row: for HER, not for the friend ---------- */}
        <section className="bg-royal-800 px-5 py-12 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold-300">
              For {name}
            </p>
            <h2 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">
              Send this to your friends
            </h2>
            <p className="mt-3 text-blush-100">
              Each button opens with the message already written — just pick who to send it to.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-4">
              <a
                className="rounded-full bg-white px-5 py-3 font-semibold text-royal-800 hover:bg-blush-50"
                href={`sms:?&body=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
              >
                Text
              </a>
              <a
                className="rounded-full bg-white px-5 py-3 font-semibold text-royal-800 hover:bg-blush-50"
                href={`mailto:?subject=${encodeURIComponent(
                  `Let's celebrate our quinces together`,
                )}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`}
              >
                Email
              </a>
              <a
                className="rounded-full bg-white px-5 py-3 font-semibold text-royal-800 hover:bg-blush-50"
                href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
                target="_blank"
                rel="noopener"
              >
                WhatsApp
              </a>
              <button
                type="button"
                onClick={copyLink}
                className="rounded-full bg-white/10 px-5 py-3 font-semibold text-white ring-1 ring-white/40 hover:bg-white/20"
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
