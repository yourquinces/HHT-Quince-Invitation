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
import {
  fetchHubProgress,
  fetchInvitationRow,
  setProfilePhoto,
  uploadProfilePhoto,
} from "../lib/liveInvitation";
import type { HubProgress } from "../lib/liveInvitation";
import HubChecklist from "./HubChecklist";
import { makeSay, useHubLang } from "../lib/hubLang";
import { sailings } from "../data/sailings";
import QuinceAvatar from "./QuinceAvatar";
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
  const [progress, setProgress] = useState<HubProgress | null>(null);
  const [lang, setLang] = useHubLang();
  const say = makeSay(lang);
  // Her profile picture is edited in place here rather than on a page of its
  // own — it is one tap, and sending her elsewhere for it would be sillier
  // than the feature.
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");

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
        // The checklist needs the same answer plus her own ticks, in one call.
        fetchHubProgress(slug).then((p) => !cancelled && p && setProgress(p));
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
            {say("We could not find this hub.", "No encontramos este portal.")}
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

  async function onPickPhoto(file: File | null) {
    if (!file || !editKey) return;
    setPhotoError("");
    setPhotoBusy(true);
    try {
      const url = await uploadProfilePhoto(slug, file);
      const ok = await setProfilePhoto(slug, editKey, url);
      if (!ok) throw new Error("link expired");
      setRow((prev) => (prev ? { ...prev, profile_image_url: url } : prev));
    } catch {
      setPhotoError(
        say(
          "That photo did not upload. Try another one, or a smaller file.",
          "Esa foto no se subió. Prueba con otra o con un archivo más pequeño.",
        ),
      );
    } finally {
      setPhotoBusy(false);
    }
  }

  async function onRemovePhoto() {
    if (!editKey) return;
    setPhotoBusy(true);
    setPhotoError("");
    try {
      await setProfilePhoto(slug, editKey, "");
      setRow((prev) => (prev ? { ...prev, profile_image_url: null } : prev));
    } catch {
      setPhotoError(say("Could not remove that photo.", "No se pudo quitar esa foto."));
    } finally {
      setPhotoBusy(false);
    }
  }

  const s = encodeURIComponent(slug);
  const registration: Tool = {
    icon: "crown",
    title: say("Quinceañera Registration Form", "Formulario de registro de quinceañera"),
    body: registered
      ? say(
          "Thank you — we have your details. Need to change something? Fill it in again and tell us.",
          "Gracias — ya tenemos tus datos. ¿Necesitas cambiar algo? Complétalo otra vez y avísanos.",
        )
      : say(
          "Start here. Tell us about you: how to reach you, who you want to sit with at dinner, your school and your socials.",
          "Empieza aquí. Cuéntanos de ti: cómo contactarte, con quién quieres sentarte a cenar, tu escuela y tus redes.",
        ),
    href: `/i/${s}/register`,
    cta: registered ? say("Fill it in again", "Completarlo otra vez") : say("Start my registration", "Empezar mi registro"),
    todo: !registered,
    done: registered,
  };

  const rest: Tool[] = [
    // Editing comes before viewing: she opens her hub to change something far
    // more often than to admire it.
    ...(editKey
      ? [
          {
            icon: "heart",
            title: say("Edit my invitation", "Editar mi invitación"),
            body: say(
              "Change your photo, your welcome message and how the photo is framed. Your changes appear instantly.",
              "Cambia tu foto, tu mensaje de bienvenida y cómo se recorta la foto. Tus cambios aparecen al instante.",
            ),
            href: `/i/${s}/edit?key=${encodeURIComponent(editKey)}`,
            cta: say("Edit", "Editar"),
          } as Tool,
        ]
      : []),
    {
      icon: "sparkles",
      title: say("My invitation", "Mi invitación"),
      body: say(
        "The invitation your family and guests see, with your photo, your message and everything about the cruise.",
        "La invitación que ven tu familia e invitados, con tu foto, tu mensaje y todo sobre el crucero.",
      ),
      href: `/i/${s}`,
      cta: say("View my invitation", "Ver mi invitación"),
    },
    {
      icon: "ship",
      title: say(
        "Invite your friend to be a quinceañera with you",
        "Invita a tu amiga a ser quinceañera contigo",
      ),
      body: say(
        "Ask your friends to have their quinceañera with you. Send it by text, email or WhatsApp with the message already written.",
        "Invita a tus amigas a celebrar sus quinces contigo. Envíalo por mensaje, correo o WhatsApp con el texto ya escrito.",
      ),
      href: `/i/${s}/friends`,
      cta: say("Invite friends", "Invitar amigas"),
    },
    // Who has booked under her — sits with the inviting, since that is the
    // question inviting raises.
    ...(editKey
      ? [
          {
            icon: "users",
            title: say("Guest list", "Lista de invitados"),
            body: say(
              "Everyone booked under your name so far, cabin by cabin. It comes straight from our reservation system, so it updates as your family and friends book.",
              "Todos los que han reservado bajo tu nombre, cabina por cabina. Viene directo de nuestro sistema de reservas, así que se actualiza a medida que reservan.",
            ),
            href: `/i/${s}/guests?key=${encodeURIComponent(editKey)}`,
            cta: say("See who is coming", "Ver quién viene"),
          } as Tool,
        ]
      : []),
    // The group cruise invitation is NOT here on purpose: it is for the adults
    // sailing with her, and they receive it on their own invoice. Her hub is
    // hers.
    {
      icon: "camera",
      title: say("Cruise photos", "Fotos del crucero"),
      body: say(
        "Upload photos and videos from the cruise, and share your album with your family.",
        "Sube fotos y videos del crucero y comparte tu álbum con tu familia.",
      ),
      soon: true,
    },
    {
      icon: "gift",
      title: say("Gift registry", "Mesa de regalos"),
      body: say(
        "Your registry, so guests know exactly what would make your quinces special.",
        "Tu mesa de regalos, para que tus invitados sepan exactamente qué haría especiales tus quinces.",
      ),
      soon: true,
    },
    {
      icon: "ship",
      title: say("Excursions", "Excursiones"),
      body: say(
        "Choose what you want to do in each port before you sail.",
        "Elige qué quieres hacer en cada puerto antes de zarpar.",
      ),
      soon: true,
    },
    {
      icon: "info",
      title: say("Quinces video", "Video de quinces"),
      body: say(
        "The video that explains how a quinceañera cruise works, to share with your family.",
        "El video que explica cómo funciona un crucero de quinceañera, para compartir con tu familia.",
      ),
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
          {/* Her page, her language. Remembered per device. */}
          <div className="mb-6 flex justify-center">
            <div className="inline-flex overflow-hidden rounded-full border border-blush-200 bg-white text-sm font-semibold">
              {(["en", "es"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  aria-pressed={lang === code}
                  className={`px-4 py-1.5 transition ${
                    lang === code ? "bg-royal-600 text-white" : "text-slate-500 hover:text-royal-700"
                  }`}
                >
                  {code === "en" ? "English" : "Español"}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center">
            <div className="flex flex-col items-center">
              <QuinceAvatar src={row.profile_image_url} name={row.preferred_name} size={104} />
              {editKey ? (
                <div className="mt-3 flex items-center gap-3 text-sm">
                  <label className="cursor-pointer font-semibold text-royal-600 hover:text-royal-700">
                    {photoBusy
                      ? say("Uploading…", "Subiendo…")
                      : row.profile_image_url
                        ? say("Change photo", "Cambiar foto")
                        : say("Add your photo", "Agrega tu foto")}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={photoBusy}
                      onChange={(e) => onPickPhoto(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {row.profile_image_url && !photoBusy && (
                    <button type="button" onClick={onRemovePhoto}
                            className="text-slate-400 hover:text-rosa-600">
                      {say("Remove", "Quitar")}
                    </button>
                  )}
                </div>
              ) : null}
              {photoError && (
                <p role="alert" className="mt-2 text-sm font-medium text-rosa-600">{photoError}</p>
              )}
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.35em] text-gold-600">
              {say("Quinceañera Hub", "Portal de la Quinceañera")}
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold text-royal-800 sm:text-4xl">
              {say(`${row.preferred_name}’s quinces, all in one place`, `Los quinces de ${row.preferred_name}, todo en un solo lugar`)}
            </h1>
            <p className="mt-3 text-slate-600">
              {row.ship
                ? say(`Sailing aboard the ${row.ship}`, `Navegando a bordo del ${row.ship}`)
                : say("Your quinceañera cruise", "Tu crucero de quinceañera")}
              {row.sailing_dates ? ` · ${row.sailing_dates}` : ""}.{" "}
              {say(
                "Bookmark this page — everything we build for you shows up here.",
                "Guarda esta página — todo lo que preparemos para ti aparece aquí.",
              )}
            </p>
          </div>

          {progress && (
            <HubChecklist
              slug={slug}
              editKey={editKey}
              progress={progress}
              groupCode={row.group_code}
              whatsappUrl={
                /* Each sail date has its own WhatsApp group — she belongs in
                   the one for her own sailing, not a general HHT group. Falls
                   back to the config value for dates with no group yet (the
                   2026 sailings), and to "ask your agent" when that is empty. */
                sailings.find((x) => x.id === row.sail_date)?.whatsappUrl ||
                invitation.whatsappGroupUrl
              }
              lang={lang}
              onChange={setProgress}
            />
          )}

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
