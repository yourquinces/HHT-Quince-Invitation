// V2 design preview of the quinceañera invitation, at /i/<slug>/v2.
//
// Same live data and the same lead form as /i/<slug> — only the look is new.
// Built alongside V1 so the two can be compared; V1 is deliberately untouched.
// Everything V2-only (fonts, keyframes) is injected from here, so nothing in
// index.html or tailwind.config.ts changes for V1.

import { useEffect, useState } from "react";
import { invitation } from "../../data/invitation";
import { inviteLang, say } from "../../lib/inviteLang";
import { datesEs, itineraryEs } from "../../lib/spanish";
import Icon from "../Icon";
import GuestInterestForm from "../GuestInterestForm";
import RegistrySection from "../RegistrySection";
import Footer from "../Footer";

const V2_CSS = `
.v2-script { font-family: 'Great Vibes', 'Playfair Display', cursive; font-weight: 400; }
.v2-shimmer {
  background: linear-gradient(100deg, #F6C3E7 0%, #DB3EB1 22%, #F6EED8 45%, #DEC684 55%, #62C6EC 78%, #F6C3E7 100%);
  background-size: 250% auto;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: v2-shimmer 7s linear infinite;
}
@keyframes v2-shimmer { to { background-position: 250% center; } }
.v2-float { animation: v2-float 6s ease-in-out infinite; }
@keyframes v2-float { 50% { transform: translateY(-10px); } }
.v2-twinkle { animation: v2-twinkle 3.2s ease-in-out infinite; }
@keyframes v2-twinkle { 0%,100% { opacity: .15; transform: scale(.7); } 50% { opacity: 1; transform: scale(1); } }
.v2-glow { animation: v2-glow 2.8s ease-in-out infinite; }
@keyframes v2-glow { 50% { box-shadow: 0 0 0 10px rgba(219,62,177,0), 0 18px 40px -12px rgba(219,62,177,.7); } 0%,100% { box-shadow: 0 0 0 0 rgba(219,62,177,.45), 0 18px 40px -12px rgba(219,62,177,.6); } }
.v2-gradient-move { background-size: 200% 200%; animation: v2-move 12s ease infinite; }
@keyframes v2-move { 50% { background-position: 100% 50%; } }
.v2-reveal { opacity: 0; transform: translateY(24px); transition: opacity .8s ease, transform .8s ease; }
.v2-reveal.v2-in { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  .v2-shimmer, .v2-float, .v2-twinkle, .v2-glow, .v2-gradient-move { animation: none; }
  .v2-reveal { opacity: 1; transform: none; transition: none; }
}
`;

/** Fixed sparkle positions, so the hero looks the same on every load. */
const SPARKLES = [
  { top: "12%", left: "8%", size: 14, delay: "0s" },
  { top: "22%", left: "46%", size: 10, delay: "1.1s" },
  { top: "68%", left: "6%", size: 12, delay: "2s" },
  { top: "82%", left: "40%", size: 9, delay: ".6s" },
  { top: "16%", left: "88%", size: 16, delay: "1.6s" },
  { top: "58%", left: "94%", size: 11, delay: ".3s" },
  { top: "40%", left: "52%", size: 8, delay: "2.4s" },
  { top: "90%", left: "78%", size: 13, delay: "1.3s" },
];

function useV2Assets() {
  useEffect(() => {
    const font = document.createElement("link");
    font.rel = "stylesheet";
    font.href = "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap";
    const style = document.createElement("style");
    style.textContent = V2_CSS;
    // A design preview should never be indexed in place of the real page.
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex";
    document.head.append(font, style, robots);

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("v2-in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12 },
    );
    document.querySelectorAll(".v2-reveal").forEach((el) => io.observe(el));
    return () => {
      font.remove();
      style.remove();
      robots.remove();
      io.disconnect();
    };
  }, []);
}

/** Days/hours/minutes/seconds until embarkation — null once she has sailed. */
function useCountdown(sailDate: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!sailDate) return null;
  // Ships board around midday; noon Eastern keeps the day count honest.
  const target = new Date(`${sailDate}T12:00:00-04:00`).getTime();
  const diff = target - now;
  if (!Number.isFinite(diff) || diff <= 0) return null;
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

function Sparkle({ size, className = "" }: { size: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <path
        d="M12 0c.6 5.4 1.8 9.6 12 12-10.2 2.4-11.4 6.6-12 12-.6-5.4-1.8-9.6-12-12C10.2 9.6 11.4 5.4 12 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

function GlassButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-8 py-4 text-sm font-semibold uppercase tracking-wider text-white backdrop-blur transition hover:bg-white/20"
    >
      {children}
    </a>
  );
}

function GlowButton({ href, children, newTab = false }: { href: string; children: React.ReactNode; newTab?: boolean }) {
  return (
    <a
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      className="v2-glow inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rosa-500 via-rosa-400 to-royal-500 px-9 py-4 text-sm font-bold uppercase tracking-wider text-white transition hover:brightness-110"
    >
      {children}
    </a>
  );
}

function Header() {
  const { agent, reservationFormUrl } = invitation;
  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="mx-auto flex h-20 w-full max-w-content items-center justify-between px-5 sm:px-8">
        <a href="#top" className="flex items-center gap-2.5" aria-label="Happy Holidays Travel home">
          <img src="/images/logo-mark.png" alt="" aria-hidden="true" className="h-10 w-auto" width={212} height={320} />
          <span className="flex items-baseline gap-2">
            <span className="font-display text-lg font-semibold text-white sm:text-xl">Happy Holidays</span>
            <span className="hidden text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-gold-300 sm:inline">
              Travel
            </span>
          </span>
        </a>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Quick actions">
          <a href={`tel:+${agent.phoneDial}`} className="rounded-full p-2.5 text-white/90 transition hover:bg-white/10" aria-label={`Call ${agent.phoneDisplay}`}>
            <Icon name="phone" className="h-5 w-5" />
          </a>
          <a href={agent.whatsappUrl} target="_blank" rel="noopener noreferrer" className="rounded-full p-2.5 text-white/90 transition hover:bg-white/10" aria-label="WhatsApp">
            <Icon name="whatsapp" className="h-5 w-5" />
          </a>
          {reservationFormUrl && (
            <a
              href={reservationFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 hidden rounded-full bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-rosa-600 shadow transition hover:bg-blush-100 sm:inline-flex"
            >
              {say("Reserve Your Cabin", "Reserve su Cabina")}
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}

function Hero({ sailDate }: { sailDate: string | null }) {
  const { quinceanera, hero, cruise, reservationFormUrl } = invitation;
  const countdown = useCountdown(sailDate);
  const units = countdown
    ? [
        [countdown.days, say("Days", "Días")],
        [countdown.hours, say("Hours", "Horas")],
        [countdown.minutes, say("Min", "Min")],
        [countdown.seconds, say("Sec", "Seg")],
      ] as const
    : [];

  return (
    <section
      id="top"
      className="v2-gradient-move relative overflow-hidden bg-[linear-gradient(135deg,#0B1A33_0%,#0D4A6B_35%,#5B1650_70%,#0B1A33_100%)] text-white"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-10 h-[28rem] w-[28rem] rounded-full bg-rosa-500/30 blur-[110px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-0 h-[30rem] w-[30rem] rounded-full bg-royal-400/25 blur-[120px]" />
      {SPARKLES.map((s, i) => (
        <span key={i} className="v2-twinkle pointer-events-none absolute text-gold-200" style={{ top: s.top, left: s.left, animationDelay: s.delay }}>
          <Sparkle size={s.size} />
        </span>
      ))}

      <div className="relative mx-auto grid min-h-[min(100svh,56rem)] w-full max-w-content items-center gap-12 px-5 pb-16 pt-28 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:pb-20">
        {/* Her photo in an arched mirror frame */}
        <div className="order-1 mx-auto w-full max-w-[19rem] sm:max-w-sm lg:order-2 lg:max-w-md">
          <div className="v2-float relative">
            <div className="absolute -inset-3 rounded-t-[999px] rounded-b-[2.5rem] bg-gradient-to-b from-gold-300 via-rosa-400 to-royal-400 opacity-80 blur-xl" aria-hidden="true" />
            <div className="relative rounded-t-[999px] rounded-b-[2.5rem] bg-gradient-to-b from-gold-200 via-gold-400 to-gold-600 p-[3px]">
              <div className="rounded-t-[999px] rounded-b-[2.4rem] bg-[#0B1A33] p-2">
                <div className="aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-[2rem]">
                  <img
                    src={hero.image}
                    alt={hero.imageAlt}
                    className="h-full w-full object-cover"
                    style={{ objectPosition: hero.imagePosition }}
                    fetchPriority="high"
                  />
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br from-gold-200 via-gold-400 to-gold-600 font-display text-2xl font-bold text-[#0B1A33] shadow-xl shadow-black/40 ring-4 ring-[#0B1A33]">
              XV
            </div>
          </div>
        </div>

        <div className="order-2 text-center lg:order-1 lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-gold-300/40 bg-white/5 px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-gold-200 backdrop-blur">
            <Icon name="crown" className="h-4 w-4" />
            {say("You’re Invited", "Está Invitado")}
          </p>
          <p className="mt-6 font-display text-lg italic text-white/80 sm:text-xl">
            {say("Join us as we celebrate", "Acompáñenos a celebrar")}
          </p>
          <h1 className="mt-1">
            <span className="v2-script v2-shimmer block pb-2 text-[5.5rem] leading-[1.05] sm:text-[7.5rem] lg:text-[8.5rem]">
              {quinceanera.preferredName}
            </span>
            <span className="mt-1 block font-display text-lg font-semibold uppercase tracking-[0.2em] text-white sm:text-2xl sm:tracking-[0.3em]">
              {say("Quinceañera Cruise", "Crucero de Quinceañera")}
            </span>
          </h1>

          <div className="mt-7 flex flex-wrap justify-center gap-2 lg:justify-start">
            {[
              { icon: "ship", text: cruise.ship },
              { icon: "calendar", text: say(cruise.sailingDates, datesEs(cruise.sailingDates)) },
              { icon: "anchor", text: cruise.departurePort },
            ].map((d) => (
              <span key={d.text} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90 ring-1 ring-white/15 backdrop-blur">
                <Icon name={d.icon} className="h-4 w-4 text-rosa-300" />
                {d.text}
              </span>
            ))}
          </div>

          {countdown && (
            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-200/90">
                {say("Countdown to sail away", "Cuenta regresiva para zarpar")}
              </p>
              <div className="mt-3 flex justify-center gap-2.5 sm:gap-3 lg:justify-start">
                {units.map(([n, label]) => (
                  <div key={label} className="w-[4.4rem] rounded-2xl bg-white/10 py-3 text-center ring-1 ring-white/20 backdrop-blur sm:w-20">
                    <div className="font-display text-2xl font-bold tabular-nums sm:text-3xl">{String(n).padStart(2, "0")}</div>
                    <div className="mt-0.5 text-[0.65rem] font-semibold uppercase tracking-widest text-white/60">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center lg:justify-start">
            {reservationFormUrl && (
              <GlowButton href={reservationFormUrl} newTab>
                {say("Reserve Your Cabin", "Reserve su Cabina")}
              </GlowButton>
            )}
            <GlassButton href="#pricing">{say("View Cabin Prices", "Ver Precios de Cabinas")}</GlassButton>
          </div>
        </div>
      </div>

      {/* wave into the letter section */}
      <svg aria-hidden="true" viewBox="0 0 1440 90" preserveAspectRatio="none" className="relative block h-12 w-full sm:h-20">
        <path d="M0 40c240 50 480 50 720 20s480-60 720-10v40H0Z" fill="#FBF0F8" />
      </svg>
    </section>
  );
}

function Letter() {
  const { invitationMessage, invitationSignature } = invitation;
  return (
    <section className="relative bg-blush-100 px-5 pb-20 pt-10 sm:px-8 sm:pb-28">
      <div className="v2-reveal relative mx-auto max-w-3xl">
        <div className="absolute left-1/2 top-0 z-10 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-rosa-400 to-rosa-600 shadow-lg shadow-rosa-600/40 ring-4 ring-blush-100">
          <span className="v2-script text-4xl text-white">15</span>
        </div>
        <div className="rounded-[2rem] bg-white p-2 shadow-2xl shadow-rosa-600/10">
          <div className="rounded-[1.6rem] border border-gold-300/70 px-6 pb-10 pt-14 text-center sm:px-14">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold-600">
              {say("A note from the family", "Un mensaje de la familia")}
            </p>
            <p className="mt-6 whitespace-pre-line font-display text-lg italic leading-relaxed text-royal-800 sm:text-2xl sm:leading-relaxed">
              {invitationMessage}
            </p>
            {invitationSignature && (
              <p className="v2-script mt-8 text-4xl text-rosa-500 sm:text-5xl">{invitationSignature}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function BoardingPass() {
  const { cruise, quinceanera } = invitation;
  const stops = [cruise.departurePort.split(",")[0], ...cruise.destinations, cruise.departurePort.split(",")[0]];
  const fields = [
    [say("Ship", "Barco"), cruise.ship],
    [say("Cruise line", "Naviera"), cruise.line],
    [say("Sailing", "Fechas"), say(cruise.sailingDates, datesEs(cruise.sailingDates))],
    [say("Itinerary", "Itinerario"), say(`${cruise.nights} Nights · ${cruise.itineraryName}`, `${cruise.nights} Noches · ${itineraryEs(cruise.itineraryName)}`)],
  ];

  return (
    <section id="details" className="relative overflow-hidden bg-[#0B1A33] px-5 py-20 text-white sm:px-8 sm:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-rosa-500/20 blur-[120px]" />
      <div className="relative mx-auto max-w-content">
        <div className="v2-reveal text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold-300">{say("All aboard", "Todos a bordo")}</p>
          <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{say("Your Boarding Pass", "Su Pase de Abordar")}</h2>
        </div>

        <div className="v2-reveal mt-12 grid items-center gap-10 lg:grid-cols-2">
          {/* the ticket */}
          <div className="relative flex flex-col overflow-hidden rounded-3xl bg-white text-royal-900 shadow-2xl shadow-black/40 sm:flex-row">
            <div className="flex-1 p-7 sm:p-8">
              <div className="flex items-center justify-between">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-rosa-500">{say("Boarding Pass", "Pase de Abordar")}</span>
                <Icon name="ship" className="h-6 w-6 text-royal-600" />
              </div>
              <p className="mt-4 text-[0.65rem] font-semibold uppercase tracking-widest text-slate-400">{say("Guest of", "Invitado de")}</p>
              <p className="v2-script text-4xl leading-tight text-rosa-500">{quinceanera.preferredName}</p>
              <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
                {fields.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[0.65rem] font-semibold uppercase tracking-widest text-slate-400">{k}</dt>
                    <dd className="mt-0.5 text-sm font-semibold leading-snug">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            {/* perforated stub */}
            <div className="relative border-t-2 border-dashed border-slate-200 bg-gradient-to-br from-rosa-500 to-royal-600 p-7 text-white sm:w-44 sm:border-l-2 sm:border-t-0">
              <span aria-hidden="true" className="absolute -left-3 -top-3 hidden h-6 w-6 rounded-full bg-[#0B1A33] sm:block" />
              <span aria-hidden="true" className="absolute -bottom-3 -left-3 hidden h-6 w-6 rounded-full bg-[#0B1A33] sm:block" />
              <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/70">{say("Departs", "Sale de")}</p>
              <p className="mt-1 font-display text-xl font-bold leading-tight">{cruise.departurePort.split(",")[0]}</p>
              <p className="mt-4 text-[0.65rem] font-semibold uppercase tracking-widest text-white/70">{say("Nights", "Noches")}</p>
              <p className="font-display text-4xl font-bold">{cruise.nights}</p>
              <div aria-hidden="true" className="mt-4 flex h-10 items-end gap-[3px]">
                {Array.from({ length: 22 }, (_, i) => (
                  <span key={i} className="bg-white/90" style={{ width: i % 3 === 0 ? 3 : 1.5, height: `${60 + ((i * 37) % 40)}%` }} />
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl ring-1 ring-white/10">
            <img src={cruise.shipImage} alt={cruise.shipImageAlt} className="aspect-[4/3] w-full object-cover" loading="lazy" />
          </div>
        </div>

        {/* route */}
        <div className="v2-reveal mt-16">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.35em] text-gold-300">{say("Ports of call", "Puertos de escala")}</p>
          <ol className="relative mx-auto mt-8 flex max-w-4xl flex-col gap-6 sm:flex-row sm:justify-between sm:gap-2">
            <span aria-hidden="true" className="absolute left-[11px] top-2 h-[calc(100%-1rem)] w-0.5 bg-gradient-to-b from-rosa-400 via-gold-300 to-royal-400 sm:left-0 sm:top-[11px] sm:h-0.5 sm:w-full sm:bg-gradient-to-r" />
            {stops.map((stop, i) => {
              const isPort = i === 0 || i === stops.length - 1;
              return (
                <li key={`${stop}-${i}`} className="relative flex items-center gap-4 sm:flex-1 sm:flex-col sm:gap-3 sm:text-center">
                  <span className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-4 ring-[#0B1A33] ${isPort ? "bg-gold-300" : "bg-rosa-400"}`}>
                    <span className="h-2 w-2 rounded-full bg-[#0B1A33]" />
                  </span>
                  <span className={`text-sm font-semibold ${isPort ? "text-gold-200" : "text-white"}`}>{stop}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Celebrate() {
  const { celebration } = invitation;
  return (
    <section className="v2-gradient-move relative overflow-hidden bg-[linear-gradient(120deg,#DB3EB1,#A81F84,#1479A6,#41B6E6)] px-5 py-20 text-center text-white sm:px-8 sm:py-28">
      {SPARKLES.slice(0, 6).map((s, i) => (
        <span key={i} className="v2-twinkle pointer-events-none absolute text-white" style={{ top: s.top, left: s.left, animationDelay: s.delay }}>
          <Sparkle size={s.size + 4} />
        </span>
      ))}
      <div className="v2-reveal relative mx-auto max-w-3xl">
        <p className="v2-script text-5xl sm:text-6xl">{say("Let’s celebrate!", "¡A celebrar!")}</p>
        <h2 className="mt-4 font-display text-3xl font-bold leading-snug sm:text-5xl">
          {say(celebration.heading, "¡Celebremos, Vacacionemos y Creemos Recuerdos Juntos!")}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/90">
          {say(
            celebration.description,
            "Acompañe a nuestra familia y amigos en una semana inolvidable llena de destinos hermosos, celebraciones privadas y recuerdos que durarán toda la vida.",
          )}
        </p>
      </div>
    </section>
  );
}

const EXPERIENCES_ES: Record<string, [string, string]> = {
  "Three Private Celebrations": ["Tres Celebraciones Privadas", "Eventos exclusivos reservados solo para nuestro grupo."],
  "Professional DJ & Entertainment": ["DJ Profesional y Entretenimiento", "Música y entretenimiento en cada celebración."],
  "Open Bar for Adults 21+": ["Barra Libre para Adultos de 21+", "Disponible durante los eventos privados del grupo."],
  "Beverages for Minors": ["Bebidas para Menores", "Bebidas sin alcohol para nuestros invitados más jóvenes."],
  "Special Quinceañera Activities": ["Actividades Especiales de Quinceañera", "Momentos creados especialmente para la quinceañera."],
  "Memories with Family & Friends": ["Recuerdos con Familia y Amigos", "Una semana única juntos en alta mar."],
};

function Included() {
  const experiences = invitation.experiences.filter((e) => e.enabled);
  if (experiences.length === 0) return null;
  return (
    <section className="bg-blush-50 px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-content">
        <div className="v2-reveal text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rosa-500">{say("The party at sea", "La fiesta en alta mar")}</p>
          <h2 className="mt-3 font-display text-4xl font-bold text-royal-900 sm:text-5xl">
            {say("What’s Included for Our Group", "Qué Incluye Nuestro Grupo")}
          </h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {experiences.map((exp) => (
            <div
              key={exp.title}
              className="v2-reveal group relative overflow-hidden rounded-3xl bg-white p-7 shadow-lg shadow-royal-900/5 ring-1 ring-blush-200 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-rosa-500/15"
            >
              <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-rosa-500 via-gold-300 to-royal-500" />
              <span className="inline-flex rounded-2xl bg-gradient-to-br from-rosa-500 to-royal-500 p-3.5 text-white shadow-lg shadow-rosa-500/30 transition group-hover:scale-110">
                <Icon name={exp.icon} className="h-6 w-6" />
              </span>
              <h3 className="mt-5 font-display text-xl font-bold text-royal-900">
                {say(exp.title, EXPERIENCES_ES[exp.title]?.[0] ?? exp.title)}
              </h3>
              {exp.description && (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {say(exp.description, EXPERIENCES_ES[exp.title]?.[1] ?? exp.description)}
                </p>
              )}
            </div>
          ))}
        </div>
        <p className="v2-reveal mx-auto mt-8 flex max-w-2xl items-start justify-center gap-2 text-center text-sm text-slate-500">
          <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
          {say(
            invitation.openBarNote,
            "La barra libre está disponible solo para invitados de 21 años o más. Habrá bebidas sin alcohol para los menores.",
          )}
        </p>
      </div>
    </section>
  );
}

function Reserve() {
  const { pricing, reservationFormUrl, depositPaymentUrl, deposit, quinceanera } = invitation;
  const occupancyLinks = pricing.occupancyLinks.filter((l) => l.url);
  const steps = [
    [say("Pick your cabin", "Elija su cabina"), say("Compare live prices for 2, 3 or 4 guests.", "Compare precios para 2, 3 o 4 personas.")],
    [say("Reserve", "Reserve"), say("Fill out the Happy Holidays Travel reservation form.", "Complete el formulario de reservación de Happy Holidays Travel.")],
    [say("Pay your deposit", "Pague su depósito"), say(`${deposit.amount} per person holds your spot.`, `${deposit.amount} por persona aparta su lugar.`)],
  ];

  return (
    <section id="pricing" className="relative overflow-hidden bg-[#0B1A33] px-5 py-20 text-white sm:px-8 sm:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 bottom-0 h-96 w-96 rounded-full bg-royal-500/25 blur-[120px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-0 h-96 w-96 rounded-full bg-rosa-500/25 blur-[120px]" />
      <div className="relative mx-auto max-w-4xl">
        <div className="v2-reveal text-center">
          <p className="v2-script text-5xl text-rosa-300 sm:text-6xl">{say("Save your spot", "Aparte su lugar")}</p>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-5xl">
            {say("Choose the Cabin That Works Best for Your Family", "Elija la Cabina Ideal para su Familia")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/70">
            {say(
              "Prices are per person and vary based on cabin category and the number of guests sharing the cabin.",
              "Los precios son por persona y varían según la categoría de la cabina y el número de personas que la comparten.",
            )}
          </p>
          {pricing.startingPricePerPerson && (
            <p className="mt-8 font-display text-2xl sm:text-3xl">
              {say("Cabins starting at", "Cabinas desde")}{" "}
              <span className="v2-shimmer font-bold">{pricing.startingPricePerPerson}</span>{" "}
              {say("per person", "por persona")}
            </p>
          )}
        </div>

        <div className="v2-reveal mt-10 flex flex-wrap justify-center gap-3">
          {pricing.fullPricingUrl && (
            <a href={pricing.fullPricingUrl} className="rounded-full bg-white px-6 py-3 text-sm font-bold uppercase tracking-wider text-royal-900 transition hover:bg-blush-100">
              {say("View Full Pricing", "Ver Todos los Precios")}
            </a>
          )}
          {occupancyLinks.map((link) => (
            <a key={link.label} href={link.url} className="rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white backdrop-blur transition hover:bg-white/15">
              {say(link.label, link.label.replace(/^(\w+) Guests Per Cabin$/, (_, n) => `${({ Two: "Dos", Three: "Tres", Four: "Cuatro" } as Record<string, string>)[n] ?? n} Personas por Cabina`))}
            </a>
          ))}
        </div>

        <ol className="mt-14 grid gap-4 sm:grid-cols-3">
          {steps.map(([title, body], i) => (
            <li key={title} className="v2-reveal rounded-3xl bg-white/[0.06] p-6 text-center ring-1 ring-white/10 backdrop-blur">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gold-200 to-gold-500 font-display text-xl font-bold text-[#0B1A33]">
                {i + 1}
              </span>
              <p className="mt-4 font-display text-lg font-bold">{title}</p>
              <p className="mt-1.5 text-sm text-white/70">{body}</p>
            </li>
          ))}
        </ol>

        <div className="v2-reveal mt-12 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
          {reservationFormUrl && (
            <GlowButton href={reservationFormUrl} newTab>
              {say("Reserve Your Cabin", "Reserve su Cabina")}
            </GlowButton>
          )}
          {depositPaymentUrl && <GlassButton href={depositPaymentUrl}>{say("Pay Your Deposit", "Pagar su Depósito")}</GlassButton>}
        </div>

        <div className="v2-reveal mx-auto mt-12 max-w-3xl rounded-2xl bg-gold-300/10 p-5 text-center text-sm leading-relaxed text-gold-100 ring-1 ring-gold-300/30">
          <p>
            {say(
              deposit.policy,
              `Se requiere un depósito no reembolsable de ${deposit.amount} por persona para comenzar el proceso de reservación.`,
            )}{" "}
            {say(
              `To join the private group celebrations, book through Happy Holidays Travel under ${quinceanera.preferredName}’s group.`,
              `Para participar en las celebraciones privadas del grupo, reserve a través de Happy Holidays Travel dentro del grupo de ${quinceanera.preferredName}.`,
            )}
          </p>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const { agent } = invitation;
  const actions = [
    { icon: "phone", label: say("Call", "Llamar"), href: `tel:+${agent.phoneDial}` },
    { icon: "whatsapp", label: "WhatsApp", href: agent.whatsappUrl },
    { icon: "mail", label: say("Email", "Correo"), href: `mailto:${agent.email}` },
  ];
  return (
    <section id="contact" className="bg-blush-100 px-5 py-20 sm:px-8 sm:py-24">
      <div className="v2-reveal mx-auto max-w-xl overflow-hidden rounded-[2rem] bg-white text-center shadow-2xl shadow-rosa-600/10">
        <div className="bg-gradient-to-r from-rosa-500 to-royal-500 px-8 py-7 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
            {say("Questions? We’re here to help", "¿Preguntas? Estamos para ayudarle")}
          </p>
          <p className="mt-2 font-display text-3xl font-bold">{agent.name}</p>
          <p className="text-sm text-white/80">{say("Your Happy Holidays Travel Agent", "Su Agente de Happy Holidays Travel")}</p>
        </div>
        <div className="p-8">
          <p className="text-slate-600">{agent.phoneDisplay}</p>
          <p className="text-slate-600">{agent.email}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {actions.map((a) => (
              <a
                key={a.label}
                href={a.href}
                target={a.href.startsWith("http") ? "_blank" : undefined}
                rel={a.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-royal-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-rosa-600"
              >
                <Icon name={a.icon} className="h-4 w-4" />
                {a.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Phone-only bar so Reserve and WhatsApp are never more than a thumb away. */
function MobileBar() {
  const { reservationFormUrl, agent } = invitation;
  if (!reservationFormUrl) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex gap-2 border-t border-white/10 bg-[#0B1A33]/90 p-3 backdrop-blur sm:hidden">
      <a href={reservationFormUrl} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-full bg-gradient-to-r from-rosa-500 to-royal-500 py-3.5 text-center text-sm font-bold uppercase tracking-wider text-white">
        {say("Reserve Your Cabin", "Reserve su Cabina")}
      </a>
      <a href={agent.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex w-14 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20">
        <Icon name="whatsapp" className="h-5 w-5" />
      </a>
    </div>
  );
}

export default function InvitationV2({ sailDate }: { sailDate: string | null }) {
  useV2Assets();
  const lang = inviteLang === "es" ? "es" : undefined;
  return (
    <div className="pb-20 sm:pb-0">
      <Header />
      <main>
        <Hero sailDate={sailDate} />
        <Letter />
        <BoardingPass />
        <Celebrate />
        <Included />
        <Reserve />
        <GuestInterestForm />
        <RegistrySection />
        <Contact />
      </main>
      <Footer lang={lang} />
      <MobileBar />
    </div>
  );
}
