// /ship-visit-allure — the announcement for the October 11, 2026 Allure of
// the Seas ship visit, in English and Spanish. A copy of ShipVisitInvitePage
// (the Sept 26 Icon visit, whose link families already have) with this
// visit's facts. Same ?lang=es convention. Mirrors
// emails/ship-visit-2026-10-11.html — change both together.
//
// Rules that differ from the Icon visit: a party is the quinceañera + up to 3
// ADULT guests, and she is the only minor allowed on board. The form does not
// enforce the party size or the 18+ rule; this page and the email state them.

import { useEffect } from "react";
import { useHubLang, makeSay } from "../lib/hubLang";
import Header from "./Header";
import Footer from "./Footer";
import Icon from "./Icon";
import PrimaryButton from "./PrimaryButton";

const RSVP_URL = "/ship-visit";
const SHIP = "Allure of the Seas";

export default function ShipVisitAllureInvitePage() {
  const [lang, setLang] = useHubLang();
  const say = makeSay(lang);

  useEffect(() => {
    document.title = say(
      "Allure of the Seas Ship Visit | Happy Holidays Travel",
      "Visita al Allure of the Seas | Happy Holidays Travel",
    );
  }, [lang, say]);

  const rsvpBy = say("Friday, October 2, 2026", "viernes 2 de octubre de 2026");

  const details = [
    {
      icon: "mapPin",
      label: say("Location", "Lugar"),
      value: say(
        "Port Everglades — 1850 Eller Dr, Fort Lauderdale, FL 33316",
        "Port Everglades — 1850 Eller Dr, Fort Lauderdale, FL 33316",
      ),
    },
    {
      icon: "calendar",
      label: say("Date", "Fecha"),
      value: say("Sunday, October 11, 2026", "Domingo 11 de octubre de 2026"),
    },
    { icon: "clock", label: say("Time", "Hora"), value: "10:00 AM" },
    {
      icon: "gift",
      label: say("Cost", "Costo"),
      value: say("$20 per person (includes a snack)", "$20 por persona (incluye una merienda)"),
    },
  ];

  // Port security turns people away for exactly these reasons, so they are a
  // list rather than a sentence people skim past.
  const rules = [
    say(
      "Everyone must present a valid photo ID to board.",
      "Todos deben presentar una identificación con foto válida para abordar.",
    ),
    say(
      "Guests (adults): driver's license or government-issued photo ID.",
      "Invitados (adultos): licencia de conducir o identificación oficial con foto.",
    ),
    say(
      "Quinceañera: school ID or government-issued photo ID.",
      "Quinceañera: identificación escolar o identificación oficial con foto.",
    ),
    say(
      "No one will be allowed to board without proper photo identification.",
      "Nadie podrá abordar sin la identificación con foto correspondiente.",
    ),
    say(
      "Each guest needs their own email address. The quinceañera may use a parent's.",
      "Cada invitado necesita su propio correo electrónico. La quinceañera puede usar el de uno de sus padres.",
    ),
  ];

  /** What every guest needs in hand before the form will take them. */
  const bring = [
    say(
      "Legal name, exactly as it appears on the photo ID they will bring",
      "Nombre legal, tal como aparece en la identificación con foto que traerá",
    ),
    say("Date of birth", "Fecha de nacimiento"),
    say("Photo ID number", "Número de identificación con foto"),
    say(
      "An email address — each guest needs their own; the quinceañera may use a parent's",
      "Un correo electrónico — cada invitado necesita el suyo; la quinceañera puede usar el de uno de sus padres",
    ),
  ];

  return (
    <div id="top" className="min-h-screen bg-blush-50 font-body text-slate-700">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-rosa-100 via-blush-50 to-white px-5 pb-14 pt-9 text-center sm:px-8 sm:pt-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-rosa-200/50 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-gold-100/70 blur-3xl"
        />

        <div className="relative mx-auto max-w-3xl">
          {/* Language toggle, above everything — a Spanish-speaking parent who
              landed on the English link should see the way out immediately. */}
          <div className="mb-7 flex justify-center">
            <div className="inline-flex overflow-hidden rounded-full border border-rosa-300 bg-white/80 backdrop-blur">
              {(["en", "es"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] transition ${
                    lang === l ? "bg-rosa-500 text-white" : "text-rosa-600 hover:bg-rosa-100"
                  }`}
                >
                  {l === "en" ? "English" : "Español"}
                </button>
              ))}
            </div>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full bg-rosa-500 px-5 py-2 text-xs font-bold uppercase tracking-[0.22em] text-white shadow-lg shadow-rosa-500/30">
            <Icon name="sparkles" className="h-4 w-4" />
            {say("Exclusive Ship Visit", "Visita Exclusiva al Barco")}
          </span>

          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.1] text-royal-800 sm:text-6xl">
            {say("Come Aboard", "Suban a Bordo del")}
            <br className="hidden sm:block" />{" "}
            <span className="text-rosa-500">
              {say("Allure of the Seas!", "¡Allure of the Seas!")}
            </span>
          </h1>

          <p className="mt-5 text-sm font-bold uppercase tracking-[0.18em] text-royal-600">
            {say("Sunday, Oct 11", "Domingo 11 de oct")} &nbsp;•&nbsp; 10:00 AM &nbsp;•&nbsp; Fort Lauderdale
          </p>

          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            {say(
              "An exclusive ship visit aboard " +
                SHIP +
                " — where the girls in your group meet, take pictures together, and step aboard a Royal Caribbean ship before sailing day.",
              "Una visita exclusiva a bordo del " +
                SHIP +
                " — donde las chicas de su grupo se conocen, se toman fotos juntas y suben a un barco de Royal Caribbean antes del día del crucero.",
            )}
          </p>

          <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
            <PrimaryButton href={RSVP_URL} className="px-10">
              {say("Reserve Your Spot", "Reserve Su Lugar")}
            </PrimaryButton>
          </div>
          <p className="mt-4 text-sm font-bold text-rosa-600">
            {say("Space is very limited — RSVP by", "El espacio es muy limitado — confirme antes del")}{" "}
            {rsvpBy}
          </p>
        </div>
      </section>

      <main className="px-5 pb-16 sm:px-8">
        <div className="mx-auto max-w-3xl">
          {/* The ship itself. Fixed heights with object-cover rather than a
              natural-height image: the source is nearly 4:3, which as a
              full-width banner pushes everything below it off the screen. */}
          <figure className="-mt-4 overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-royal-800/10">
            <img
              src="/images/allure-dusk.jpg"
              alt={say(
                "Allure of the Seas at sunset, under way on open water",
                "El Allure of the Seas al atardecer, navegando en alta mar",
              )}
              width={1200}
              height={900}
              className="h-56 w-full object-cover sm:h-80 lg:h-96"
            />
          </figure>

          {/* The letter */}
          <section className="mt-8 rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-blush-200 sm:p-10">
            <p className="font-display text-xl text-royal-800">
              {say("Dear Quinceañeras & Parents,", "Estimadas Quinceañeras y Padres,")}
            </p>
            <div className="mt-5 space-y-4 text-base leading-relaxed text-slate-600">
              <p>
                {say(
                  "We are excited to invite you to our next Quinceañera Cruise event — an exclusive ship visit aboard " + SHIP + ".",
                  "Nos emociona invitarles a nuestro próximo evento del Crucero de Quinceañeras — una visita exclusiva a bordo del " + SHIP + ".",
                )}
              </p>
              <p>
                {say(
                  "This is more than just a ship visit. It is part of your Quinceañera Cruise journey.",
                  "Esto es más que una visita al barco. Es parte de su travesía del Crucero de Quinceañera.",
                )}
              </p>
              <p>
                {say(
                  "This is your chance to meet other quinceañeras in your group. You'll get to spend time together, take group pictures, explore the incredible " +
                    SHIP +
                    ", and start getting to know the girls you'll be sharing this unforgettable experience with.",
                  "Es la oportunidad de conocer a otras quinceañeras de su grupo. Pasarán tiempo juntas, se tomarán fotos en grupo, explorarán el increíble " +
                    SHIP +
                    " y comenzarán a conocer a las chicas con quienes compartirán esta experiencia inolvidable.",
                )}
              </p>
              <p className="font-semibold text-rosa-600">
                {say(
                  "The cruise may still be months away, but the Quinceañera Cruise experience starts now.",
                  "El crucero puede estar a meses de distancia, pero la experiencia del Crucero de Quinceañera comienza ahora.",
                )}
              </p>
              <p>
                {say(
                  "We strongly encourage every quinceañera to attend. These pre-cruise events are part of what makes the experience so special, and they help create the friendships, excitement and memories that build all the way up to sailing day.",
                  "Recomendamos mucho que todas las quinceañeras asistan. Estos eventos previos al crucero son parte de lo que hace esta experiencia tan especial, y ayudan a crear las amistades, la emoción y los recuerdos que se van construyendo hasta el día de zarpar.",
                )}
              </p>
            </div>
          </section>

          {/* The details */}
          <section className="mt-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-royal-800 via-royal-700 to-royal-800 p-7 shadow-xl sm:p-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-gold-500/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-gold-100">
              <Icon name="ship" className="h-4 w-4" />
              {say("Exclusive Ship Visit", "Visita Exclusiva al Barco")}
            </span>
            <h2 className="mt-5 font-display text-3xl font-bold text-white sm:text-4xl">{SHIP}</h2>

            <dl className="mt-7 grid gap-4 sm:grid-cols-2">
              {details.map((d) => (
                <div
                  key={d.label}
                  className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur"
                >
                  <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold-200">
                    <Icon name={d.icon} className="h-4 w-4" />
                    {d.label}
                  </dt>
                  <dd className="mt-2 text-base font-medium leading-snug text-white">{d.value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-7 text-base leading-relaxed text-royal-100">
              {say(
                "You'll have the opportunity to walk aboard " +
                  SHIP +
                  ", explore some of its incredible spaces, and picture yourself celebrating onboard with your group. And of course — come ready for pictures.",
                "Tendrán la oportunidad de subir a bordo del " +
                  SHIP +
                  ", explorar algunos de sus espacios increíbles e imaginarse celebrando a bordo con su grupo. Y por supuesto — ¡vengan listas para las fotos!",
              )}
            </p>
          </section>

          {/* The rules that get people turned away at the gate */}
          <section className="mt-8 rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-rosa-200 sm:p-10">
            <h2 className="flex items-center gap-2.5 font-display text-2xl font-bold text-royal-800">
              <span className="inline-flex rounded-full bg-rosa-100 p-2 text-rosa-600">
                <Icon name="info" className="h-5 w-5" />
              </span>
              {say("Important Information", "Información Importante")}
            </h2>

            <p className="mt-5 text-base leading-relaxed text-slate-600">
              {say(
                "Due to limited space, each quinceañera may be accompanied by ",
                "Por espacio limitado, cada quinceañera puede venir acompañada de ",
              )}
              <strong className="font-semibold text-royal-700">
                {say("up to 3 adult guests (18+)", "hasta 3 invitados adultos (18+)")}
              </strong>
              {say(
                ". The quinceañera is the only minor allowed on board.",
                ". La quinceañera es la única menor permitida a bordo.",
              )}
            </p>

            <ul className="mt-5 space-y-3">
              {rules.map((rule) => (
                <li key={rule} className="flex gap-3 text-base leading-relaxed text-slate-600">
                  <Icon name="check" className="mt-1 h-4 w-4 flex-none text-rosa-500" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* RSVP */}
          <section className="mt-8 rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-blush-200 sm:p-10">
            <h2 className="flex items-center gap-2.5 font-display text-2xl font-bold text-royal-800">
              <span className="inline-flex rounded-full bg-royal-100 p-2 text-royal-600">
                <Icon name="phone" className="h-5 w-5" />
              </span>
              {say("Reserve Your Spot", "Reserve Su Lugar")}
            </h2>

            <p className="mt-5 text-base leading-relaxed text-slate-600">
              {say("RSVP by ", "Confirme antes del ")}
              <strong className="font-semibold text-royal-700">{rsvpBy}</strong>
              {say(
                ". To reserve, complete the form and choose October 11 — Allure of the Seas. You will need the following for each person:",
                ". Para reservar, complete el formulario y elija el 11 de octubre — Allure of the Seas. Necesitará lo siguiente para cada persona:",
              )}
            </p>

            <ul className="mt-5 space-y-3">
              {bring.map((item) => (
                <li key={item} className="flex gap-3 text-base leading-relaxed text-slate-600">
                  <Icon name="check" className="mt-1 h-4 w-4 flex-none text-royal-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="mt-5 text-base leading-relaxed text-slate-600">
              {say(
                "Payment is required at the time of RSVP — the form takes you straight to it once your details are saved. ",
                "El pago se requiere al momento de reservar — el formulario lo llevará directamente al pago una vez guardados sus datos. ",
              )}
              <strong className="font-semibold text-rosa-600">
                {say(
                  "Your spot is not held until payment is made.",
                  "Su lugar no queda apartado hasta realizar el pago.",
                )}
              </strong>
            </p>

            <div className="mt-7">
              <PrimaryButton href={RSVP_URL} className="px-10">
                {say("Reserve Your Spot Here", "Reserve Su Lugar Aquí")}
              </PrimaryButton>
            </div>

            <p className="mt-4 text-sm font-bold text-rosa-600">
              {say(
                "Space is very limited, so please reserve as soon as possible.",
                "El espacio es muy limitado, por favor reserve lo antes posible.",
              )}
            </p>
          </section>

          {/* Sign-off */}
          <section className="mt-8 rounded-[2rem] bg-gradient-to-br from-rosa-200 via-blush-100 to-gold-100 p-7 text-center sm:p-10">
            <Icon name="sparkles" className="mx-auto h-7 w-7 text-rosa-500" />
            <p className="mt-4 text-base leading-relaxed text-slate-700">
              {say(
                "We can't wait to see everyone on board.",
                "No podemos esperar a verlos a todos a bordo.",
              )}
            </p>
            <p className="mt-4 font-display text-xl font-semibold text-royal-800">
              {say(
                "Meet your group. Take your pictures. Step aboard Allure.",
                "Conozca a su grupo. Tómense sus fotos. Suban a bordo del Allure.",
              )}
              <br />
              <span className="text-rosa-600">
                {say("And let the countdown begin!", "¡Y que empiece la cuenta regresiva!")}
              </span>
            </p>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-royal-700">
              {say("Happy Holidays Travel Staff", "Equipo de Happy Holidays Travel")}
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
