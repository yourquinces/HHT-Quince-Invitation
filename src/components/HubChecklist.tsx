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
//
// It arrives collapsed, showing the ONE thing she has to do next. A hub with
// seven expanded rows sitting on top of eight tiles is a wall; one row is an
// instruction. The header still carries the whole story either way — the count,
// the bar, and green when everything is done — so folded up it never hides
// whether anything is outstanding.

import { useState } from "react";
import { setChecklistItem } from "../lib/liveInvitation";
import type { HubProgress } from "../lib/liveInvitation";
import { makeSay } from "../lib/hubLang";
import type { Lang } from "../lib/hubLang";
import Icon from "./Icon";

interface Item {
  key: string;
  title: string;
  body: string;
  icon: string;
  href?: string;
  cta?: string;
  /** For items that lead to more than one place, like an app on two stores. */
  links?: { href: string; label: string }[];
  /** Set for items we can verify; those are never tickable by hand. */
  earned?: boolean;
}

export default function HubChecklist({
  slug, editKey, progress, whatsappUrl, lang, onChange,
}: {
  slug: string;
  editKey: string;
  progress: HubProgress;
  whatsappUrl?: string;
  lang: Lang;
  onChange: (next: HubProgress) => void;
}) {
  const say = makeSay(lang);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const s = encodeURIComponent(slug);

  const items: Item[] = [
    {
      key: "registration",
      title: say("Fill in your registration form", "Completa tu formulario de registro"),
      body: say(
        "How to reach you, who you want to sit with at dinner, your school and your socials.",
        "Cómo contactarte, con quién quieres sentarte a cenar, tu escuela y tus redes sociales.",
      ),
      icon: "crown",
      href: `/i/${s}/register`,
      cta: say("Start my registration", "Empezar mi registro"),
      earned: progress.registered,
    },
    {
      key: "shipvisit",
      title: say("Sign up for a ship visit", "Regístrate para visitar el barco"),
      body: say(
        "Come aboard and see the ship before you sail. Bring photo ID for everyone coming.",
        "Sube a bordo y conoce el barco antes de zarpar. Trae identificación con foto para cada persona.",
      ),
      icon: "ship",
      href: `/ship-visit?slug=${s}`,
      cta: say("Register for a visit", "Registrarme para una visita"),
      earned: progress.ship_visit,
    },
    {
      key: "whatsapp",
      title: say("Join the WhatsApp group", "Únete al grupo de WhatsApp"),
      body: whatsappUrl
        ? say(
            "Where we post updates, plans and everything as the cruise gets closer.",
            "Donde publicamos novedades, planes y todo mientras se acerca el crucero.",
          )
        : say(
            "Ask your agent for the group link — we will add you.",
            "Pídele el enlace del grupo a tu agente — te agregamos.",
          ),
      icon: "phone",
      href: whatsappUrl || undefined,
      cta: say("Join the group", "Unirme al grupo"),
    },
    {
      key: "rcapp",
      title: say(
        "Download the Royal Caribbean app",
        "Descarga la app de Royal Caribbean",
      ),
      body: say(
        "Start designing your cruise — check in, see the ship, book shows and dinner before you sail.",
        "Empieza a planear tu crucero — haz el check-in, conoce el barco y reserva shows y cenas antes de zarpar.",
      ),
      icon: "phone",
      links: [
        { href: "https://apps.apple.com/us/app/royal-caribbean-international/id1260728016", label: "iPhone" },
        { href: "https://play.google.com/store/apps/details?id=com.rccl.royalcaribbean&hl=en_US", label: "Android" },
      ],
    },
    {
      key: "instagram",
      title: say("Follow @hhtcruises on Instagram", "Síguenos en Instagram @hhtcruises"),
      body: say(
        "Photos from every sailing, and the first word on new dates.",
        "Fotos de cada crucero y las primeras noticias sobre nuevas fechas.",
      ),
      icon: "camera",
      href: "https://instagram.com/hhtcruises",
      cta: say("Open Instagram", "Abrir Instagram"),
    },
    {
      key: "x",
      title: say("Follow @hhtcruises on X", "Síguenos en X @hhtcruises"),
      body: say(
        "The same news, if X is where you already are.",
        "Las mismas novedades, si X es donde ya estás.",
      ),
      icon: "sparkles",
      href: "https://x.com/hhtcruises",
      cta: say("Open X", "Abrir X"),
    },
    {
      key: "friends",
      title: say(
        "Invite a friend to have her quinces with you",
        "Invita a una amiga a celebrar sus quinces contigo",
      ),
      body: say(
        "Ask a friend to celebrate hers on the same cruise — one week, both parties.",
        "Invita a una amiga a celebrar los suyos en el mismo crucero — una semana, las dos fiestas.",
      ),
      icon: "heart",
      href: `/i/${s}/friends`,
      cta: say("Invite a friend", "Invitar a una amiga"),
    },
    {
      // Her own invitation, not the neutral group one: the family always sends
      // the quinceañera invitation. The neutral version exists for the adults
      // already sailing to forward to their own circle, and it reaches them on
      // their invoice — it was never hers to hand out.
      key: "family",
      title: say(
        "Send your invitation to family and friends",
        "Envía tu invitación a tu familia y amigos",
      ),
      body: say(
        "Your invitation page — your photo, your message, the cruise, the prices and how to book.",
        "Tu página de invitación — tu foto, tu mensaje, el crucero, los precios y cómo reservar.",
      ),
      icon: "users",
      href: `/i/${s}`,
      cta: say("Open my invitation", "Abrir mi invitación"),
    },
  ];

  const isDone = (i: Item) => (i.earned !== undefined ? i.earned : !!progress.checklist[i.key]);
  const doneCount = items.filter(isDone).length;
  const allDone = doneCount === items.length;

  // Collapsed by default, but never empty: folded up it still shows the next
  // thing she has to do, so the card answers "what now?" without being opened.
  // A hub with seven expanded rows on top of eight tiles is a wall; one row is
  // an instruction.
  const openKey = `hht_hub_checklist_open_${slug}`;
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(openKey) === "1";
    } catch {
      return false;
    }
  });

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    try {
      localStorage.setItem(openKey, next ? "1" : "0");
    } catch {
      /* not worth failing over */
    }
  }

  // The one shown while collapsed: the first thing still outstanding.
  const nextItem = items.find((i) => !isDone(i)) ?? null;
  const shown = open ? items : nextItem ? [nextItem] : [];

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
      setError(
        say(
          "That did not save. Check you opened this page from your own link.",
          "No se guardó. Revisa que hayas abierto esta página desde tu propio enlace.",
        ),
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mt-9 rounded-2xl bg-white ring-1 ring-blush-200">
      {/* Collapsed or open, the header carries the whole story: what it is,
          how far along she is, and green when it is finished. */}
      <div className="p-5 pb-0 sm:p-6 sm:pb-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl font-bold text-royal-800">
            {say("Your checklist", "Tu lista")}
          </h2>
          <span className={`text-sm font-semibold ${allDone ? "text-emerald-600" : "text-slate-500"}`}>
            {allDone
              ? say("All done — nice work!", "¡Todo listo — bien hecho!")
              : say(
                  `${doneCount} of ${items.length} done`,
                  `${doneCount} de ${items.length} completado${doneCount === 1 ? "" : "s"}`,
                )}
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-blush-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-emerald-500" : "bg-royal-500"}`}
            style={{ width: `${(doneCount / items.length) * 100}%` }}
          />
        </div>

        {!open && nextItem && (
          <p className="mt-3 text-sm text-slate-500">
            {say("Next up:", "Lo siguiente:")}
          </p>
        )}
      </div>

      <div className="px-5 pb-5 pt-3 sm:px-6 sm:pb-6">
          {error && <p role="alert" className="mb-3 text-sm font-medium text-rosa-600">{error}</p>}

        <ul className="space-y-2.5">
          {shown.map((item) => {
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
                        ? `${item.title} — ${done ? say("done", "completado") : say("not done yet", "pendiente")}`
                        : `${say("Mark as", "Marcar como")} ${done ? say("not done", "pendiente") : say("done", "completado")}: ${item.title}`
                    }
                    title={
                      item.earned !== undefined
                        ? say(
                            "This ticks itself once we have your details",
                            "Se marca solo cuando tengamos tus datos",
                          )
                        : canTick
                          ? say("Tap when you have done it", "Toca cuando lo hayas hecho")
                          : say(
                              "Open your hub from your own link to tick this",
                              "Abre tu hub desde tu propio enlace para marcarlo",
                            )
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
                      {item.links?.map((l) => (
                        <a
                          key={l.href}
                          href={l.href}
                          target="_blank"
                          rel="noopener"
                          className="font-semibold text-royal-600 hover:text-royal-700"
                        >
                          {l.label} →
                        </a>
                      ))}
                      {item.earned !== undefined ? (
                        <span className="text-xs text-slate-400">
                          {done
                            ? say("We have this — ticked for you", "Ya lo tenemos — marcado por ti")
                            : say("Ticks itself once we have it", "Se marca solo cuando lo tengamos")}
                        </span>
                      ) : canTick ? (
                        <button
                          type="button"
                          onClick={() => toggle(item)}
                          disabled={busy === item.key}
                          className="text-xs font-medium text-slate-400 hover:text-royal-600"
                        >
                          {done
                            ? say("Not done after all", "En realidad no")
                            : say("Mark as done", "Marcar como hecho")}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
        </ul>

        {/* One row is enough to know what to do next; the rest is on request. */}
        {items.length > 1 && (
          <button
            type="button"
            onClick={toggleOpen}
            aria-expanded={open}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-blush-200 py-2.5 text-sm font-semibold text-royal-600 transition hover:border-royal-300 hover:bg-blush-50/60"
          >
            {open
              ? say("Show less", "Ver menos")
              : allDone
                ? say(`Show all ${items.length}`, `Ver los ${items.length}`)
                : say(
                    `Show all ${items.length} — ${items.length - doneCount} still to do`,
                    `Ver los ${items.length} — te faltan ${items.length - doneCount}`,
                  )}
            <span aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
          </button>
        )}
      </div>
    </section>
  );
}
