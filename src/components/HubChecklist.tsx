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
// It collapses, and the collapsed header still carries the whole story — the
// count, the bar, and green when everything is done — so folding it away never
// hides whether she has anything left to do.

import { useEffect, useState } from "react";
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
  /** Set for items we can verify; those are never tickable by hand. */
  earned?: boolean;
}

export default function HubChecklist({
  slug, editKey, progress, groupCode, whatsappUrl, lang, onChange,
}: {
  slug: string;
  editKey: string;
  progress: HubProgress;
  groupCode?: string | null;
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
      key: "family",
      title: say(
        "Invite your family and friends to the cruise",
        "Invita a tu familia y amigos al crucero",
      ),
      body: groupCode
        ? say(
            "The invitation for everyone else — the cruise, the prices and how to book.",
            "La invitación para los demás — el crucero, los precios y cómo reservar.",
          )
        : say(
            "Ask your agent for the invitation to send your family.",
            "Pídele a tu agente la invitación para enviar a tu familia.",
          ),
      icon: "users",
      href: groupCode ? `/c/${groupCode}` : undefined,
      cta: say("Open the invitation", "Abrir la invitación"),
    },
  ];

  const isDone = (i: Item) => (i.earned !== undefined ? i.earned : !!progress.checklist[i.key]);
  const doneCount = items.filter(isDone).length;
  const allDone = doneCount === items.length;

  // Open when there is something left to do, folded away when there is not —
  // then remember whatever she decides herself.
  const openKey = `hht_hub_checklist_open_${slug}`;
  const [open, setOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(openKey);
      if (saved === "1") return true;
      if (saved === "0") return false;
    } catch {
      /* ignore */
    }
    return true;
  });
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (touched) return;
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(openKey);
    } catch {
      /* ignore */
    }
    if (saved === null) setOpen(!allDone);
  }, [allDone, openKey, touched]);

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    setTouched(true);
    try {
      localStorage.setItem(openKey, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

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
      {/* The header is the whole summary, so collapsing hides nothing that
          matters: what it is, how far along she is, and green when finished. */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        className="w-full rounded-2xl p-5 text-left sm:p-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl font-bold text-royal-800">
            {say("Your checklist", "Tu lista")}
          </h2>
          <span className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${allDone ? "text-emerald-600" : "text-slate-500"}`}>
              {allDone
                ? say("All done — nice work!", "¡Todo listo — bien hecho!")
                : say(
                    `${doneCount} of ${items.length} done`,
                    `${doneCount} de ${items.length} completado${doneCount === 1 ? "" : "s"}`,
                  )}
            </span>
            <span
              aria-hidden="true"
              className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
            >
              ▾
            </span>
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-blush-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-emerald-500" : "bg-royal-500"}`}
            style={{ width: `${(doneCount / items.length) * 100}%` }}
          />
        </div>

        {!open && !allDone && (
          <p className="mt-2 text-sm text-slate-500">
            {say(
              `${items.length - doneCount} still to do — tap to see them.`,
              `Te faltan ${items.length - doneCount} — toca para verlos.`,
            )}
          </p>
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          {error && <p role="alert" className="mb-3 text-sm font-medium text-rosa-600">{error}</p>}

          <ul className="space-y-2.5">
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
        </div>
      )}
    </section>
  );
}
