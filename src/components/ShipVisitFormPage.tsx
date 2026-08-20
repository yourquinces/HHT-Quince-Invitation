// Ship Visit registration — /ship-visit
//
// Replaces the 123ContactForm. Differences from the old one, each from how it
// was actually used:
//
//   · The first question is whether the quinceañera is being registered here.
//     Families come back to add relatives after she is already booked, and
//     re-entering her details was both busywork and a double count against the
//     tour's capacity. Answer "already registered" and her section collapses to
//     her name, which is only there to say whose group these guests belong to.
//   · The visit date is picked from the dates the office has opened, so nobody
//     registers for a tour that is not happening. How many places remain is
//     deliberately NOT shown — that is the office's business. A full date says
//     only that it is full, because a family that cannot be told will fill in
//     the whole form and then be turned away.
//   · Every person needs their own email address. One address was being used
//     for a whole family, which makes it impossible to tell people apart.
//   · Notes is optional. It was starred as required on the old form, which is
//     why so many submissions carry a note that says nothing.
//
// English labels with Spanish placeholders, exactly as the old form ran — most
// families read one or the other and the pairing has worked for them.

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { invitation } from "../data/invitation";
import { fetchShipVisits, submitShipVisit } from "../lib/shipVisits";
import type { ShipVisit } from "../lib/shipVisits";
import { sailings } from "../data/sailings";
import Header from "./Header";
import Footer from "./Footer";
import Section from "./Section";
import Icon from "./Icon";
import ShipVisitPass from "./ShipVisitPass";
import type { PassPerson } from "./ShipVisitPass";

type Status = "idle" | "submitting" | "success" | "error";

const ID_TYPES = ["Passport", "Driver's License", "State ID", "School ID", "Birth Certificate", "Other"];
// Same gateway and the same 15 seconds as the booking form and the Cozumel
// form, so a family who has used one of ours recognises this one.
const DEPOSIT_URL = "https://hhtcruises.net/deposit.php";
const REDIRECT_SECONDS = 15;
const AGENTS = ["Luisa", "Camila", "Isabel", "Keren", "Sergio", "Beatriz", "Maurice", "Other"];

const input =
  "w-full rounded-xl border border-blush-200 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-royal-400";
const inputBad = "w-full rounded-xl border border-rosa-400 bg-rosa-50/40 px-4 py-3 text-slate-800 focus:border-rosa-500";
const label = "mb-1.5 block text-sm font-semibold text-royal-800";

function Field({
  id, en, es, required, type = "text", value, onChange, options, bad, hint,
}: {
  id: string; en: string; es: string; required?: boolean; type?: string;
  value: string; onChange: (v: string) => void; options?: string[];
  bad?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className={label} htmlFor={id}>
        {en} {required && <span className="text-rosa-500">*</span>}
      </label>
      {options ? (
        <select id={id} className={input} required={required} value={value}
                onChange={(e) => onChange(e.target.value)}>
          <option value="">{es}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input id={id} type={type} className={bad ? inputBad : input} required={required}
               placeholder={es} value={value} onChange={(e) => onChange(e.target.value)}
               {...(type === "date" ? {} : { autoComplete: "off" })} />
      )}
      {hint && <p className={`mt-1 text-xs ${bad ? "font-medium text-rosa-600" : "text-slate-500"}`}>{hint}</p>}
    </div>
  );
}

/** Adult on the day of the visit, not today — a guest who turns 18 between
 *  registering and touring is an adult at the gangway. Mirrors svis_is_adult
 *  in the database, including treating an unknown date of birth as an adult so
 *  a blank can never buy a free pass on the uniqueness rule. */
function isAdultAt(dob: string, visitDate: string | undefined): boolean {
  if (!dob || !visitDate) return true;
  const [by, bm, bd] = dob.split("-").map(Number);
  const [vy, vm, vd] = visitDate.split("-").map(Number);
  if (!by || !vy) return true;
  let age = vy - by;
  if (vm < bm || (vm === bm && vd < bd)) age -= 1;
  return age >= 18;
}

function visitLabel(v: ShipVisit): string {
  const [y, m, d] = v.visit_date.split("-").map(Number);
  const date = new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short", month: "long", day: "numeric", year: "numeric",
  });
  const bits = [date];
  if (v.visit_time) bits.push(v.visit_time);
  if (v.ship) bits.push(v.ship);
  return bits.join(" · ");
}

export default function ShipVisitFormPage() {
  const [visits, setVisits] = useState<ShipVisit[] | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  // Set on a successful save so the pass can carry a confirmation code.
  const [savedId, setSavedId] = useState("");
  // Deposit redirect, same 15s pattern as the booking and Cozumel forms.
  // Null once the countdown has been called off — see cancelRedirect.
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  // ?mode=guests opens straight into "she is already registered", so an agent
  // can send a family a link for adding relatives without explaining anything.
  // Set when the form is opened from her hub, so her checklist can tick the
  // ship visit itself rather than trusting a self-report.
  const invitationSlug = new URLSearchParams(window.location.search).get("slug") ?? "";
  const [withQuince, setWithQuince] = useState(
    new URLSearchParams(window.location.search).get("mode") !== "guests",
  );
  const [f, setF] = useState({
    visit_id: "", quince_first: "", quince_last: "", quince_dob: "", quince_email: "",
    quince_id_type: "", quince_id_number: "", sail_date: "", cell_phone: "",
    guest1_first: "", guest1_last: "", guest1_dob: "", guest1_email: "",
    guest1_id_type: "", guest1_id_number: "",
    guest2_first: "", guest2_last: "", guest2_dob: "", guest2_email: "",
    guest2_id_type: "", guest2_id_number: "",
    agent: "", notes: "", botField: "",
  });
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    document.title = "Ship Visit Registration | Happy Holidays Travel";
    fetchShipVisits().then(setVisits).catch(() => setVisits([]));
  }, []);

  // Tick down to the payment page. The manual button is always there, so this
  // is only for families who would otherwise close the tab and forget.
  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) { window.location.href = DEPOSIT_URL; return; }
    const t = setTimeout(() => setSecondsLeft((n) => (n === null ? null : n - 1)), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const cancelRedirect = () => setSecondsLeft(null);

  const hasG1 = !!f.guest1_first.trim();
  const hasG2 = !!f.guest2_first.trim();

  // Has to match what the server counts: she only takes a place when she is
  // being registered on this form.
  const partySize = (withQuince ? 1 : 0) + (hasG1 ? 1 : 0) + (hasG2 ? 1 : 0);

  // Declared before duplicateEmail, which reads the visit date off it to work
  // out who is a minor.
  const chosen = visits?.find((v) => v.id === f.visit_id);

  // Caught here as well as on the server, so it is visible while typing
  // rather than after pressing Register.
  //
  // Only ADULTS are checked. A minor's address is her guardian's — that is the
  // whole point of collecting it — and the quinceañera herself is nearly
  // always one of them.
  const duplicateEmail = useMemo(() => {
    const on = chosen?.visit_date;
    const seen = new Map<string, number>();
    const entries: [string, string, string][] = [];
    if (withQuince) entries.push(["quince", f.quince_email, f.quince_dob]);
    if (hasG1) entries.push(["guest1", f.guest1_email, f.guest1_dob]);
    if (hasG2) entries.push(["guest2", f.guest2_email, f.guest2_dob]);
    for (const [who, raw, dob] of entries) {
      const e = raw.trim().toLowerCase();
      if (!e) continue;
      if (!isAdultAt(dob, on)) continue;
      seen.set(e, (seen.get(e) ?? 0) + 1);
      if (seen.get(e)! > 1) return { email: e, who };
    }
    return null;
  }, [withQuince, hasG1, hasG2, chosen?.visit_date,
      f.quince_email, f.guest1_email, f.guest2_email,
      f.quince_dob, f.guest1_dob, f.guest2_dob]);

  const wontFit = !!chosen && partySize > chosen.remaining;
  const noPeople = partySize === 0;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (f.botField) return;
    setStatus("submitting");
    setError("");
    try {
      const { botField, ...rest } = f;
      const res = await submitShipVisit({
        ...rest,
        registering_quince: withQuince,
        invitation_slug: invitationSlug || undefined,
      });
      if (!res.ok) {
        setError(res.error || "Could not save that. Please try again.");
        setStatus("error");
        fetchShipVisits().then(setVisits).catch(() => {});   // refresh spot counts
        return;
      }
      setSavedId(res.id ?? "");
      setStatus("success");
      setSecondsLeft(REDIRECT_SECONDS);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Something went wrong. Please try again, or call the office.");
      setStatus("error");
    }
  }

  if (status === "success") {
    // Everyone this form just put on the tour. She is on it only when she was
    // registered here — otherwise her name is the group label and she already
    // has a pass of her own from the form that registered her.
    const passPeople: PassPerson[] = [
      ...(withQuince
        ? [{ who: "Quinceañera", name: `${f.quince_first} ${f.quince_last}`.trim(), idType: f.quince_id_type }]
        : []),
      ...(hasG1 ? [{ who: "Guest 1", name: `${f.guest1_first} ${f.guest1_last}`.trim(), idType: f.guest1_id_type }] : []),
      ...(hasG2 ? [{ who: "Guest 2", name: `${f.guest2_first} ${f.guest2_last}`.trim(), idType: f.guest2_id_type }] : []),
    ];
    return (
      <>
        <Header />
        <main className="px-5 py-14">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-3xl font-bold text-royal-800 sm:text-4xl">
              🚢 Ship Visit Registration Confirmed!
            </h1>
            <div className="mt-5 space-y-3 text-left text-slate-700">
              <p>Hello! 😊</p>
              <p>We’re excited to confirm your registration for our upcoming Ship Visit!</p>
              <p>
                <strong>📸 Important:</strong> Everyone attending must bring the same photo ID that
                was entered during registration. The port will require it for entry.
              </p>
              <p>
                During the week before the ship visit, we will send you all the information and
                details you need to get to the port, including the meeting point and arrival
                instructions.
              </p>
              <p>
                If you have any questions, please call us at{" "}
                <a href={`tel:+${invitation.office.phoneDial}`} className="font-semibold text-royal-600">
                  {invitation.office.phoneDisplay}
                </a>
                .
              </p>
              <p>We look forward to seeing you there! 💙🚢</p>
            </div>

            <div className="mt-8 border-t border-blush-200 pt-6 text-left text-slate-700">
              <h2 className="font-display text-2xl font-bold text-royal-800">
                🚢 ¡Registro Confirmado para la Visita al Barco!
              </h2>
              <div className="mt-4 space-y-3">
                <p>¡Hola! 😊</p>
                <p>¡Nos complace confirmar su registro para nuestra próxima Visita al Barco!</p>
                <p>
                  <strong>📸 Importante:</strong> Todas las personas que asistirán deben traer la
                  misma identificación con foto que ingresaron al momento de registrarse. El puerto
                  solicitará esta identificación para poder ingresar.
                </p>
                <p>
                  Durante la semana previa a la visita al barco, les enviaremos toda la información
                  y los detalles necesarios para llegar al puerto, incluyendo el punto de encuentro
                  e instrucciones de llegada.
                </p>
                <p>
                  Si tienen alguna pregunta, pueden llamarnos al{" "}
                  <a href={`tel:+${invitation.office.phoneDial}`} className="font-semibold text-royal-600">
                    {invitation.office.phoneDisplay}
                  </a>
                  .
                </p>
                <p>¡Estamos emocionados de recibirlos! 💙🚢</p>
              </div>
            </div>

            {/* Payment, same shape as the booking and Cozumel forms: say the
                spot is not secured, give a button, and fall back to a timer for
                families who would otherwise close the tab. */}
            {chosen && chosen.price_per_person > 0 && (
              <div className="mt-8 rounded-2xl bg-gold-100/60 px-5 py-5 ring-1 ring-gold-200">
                <h3 className="font-display text-lg font-bold text-royal-800">
                  ⚠️ Your spot is not yet reserved
                  <span className="mt-0.5 block text-base font-semibold text-slate-600">
                    ⚠️ Su lugar aún no está reservado
                  </span>
                </h3>
                <p className="mt-2 text-slate-700">
                  The ship visit is ${chosen.price_per_person.toFixed(2)} per person —{" "}
                  <strong className="text-royal-800">
                    ${(partySize * chosen.price_per_person).toFixed(2)}
                  </strong>{" "}
                  for your {partySize === 1 ? "registration" : `${partySize} people`}. Please
                  complete your payment now to secure it.
                  <span className="mt-1 block text-sm text-slate-600">
                    La visita al barco cuesta ${chosen.price_per_person.toFixed(2)} por persona.
                    Complete su pago ahora para asegurar su lugar.
                  </span>
                </p>
                <a
                  href={DEPOSIT_URL}
                  className="mt-4 inline-block rounded-full bg-gradient-to-r from-rosa-500 to-royal-500 px-8 py-3 font-semibold text-white shadow-lg shadow-royal-800/20"
                >
                  💳 Pay Now → / Pagar Ahora →
                </a>
                {secondsLeft !== null && (
                  <p className="mt-3 text-sm text-slate-600">
                    You’ll be redirected to the payment page in{" "}
                    <strong>{secondsLeft}</strong> seconds…
                    <span className="mt-0.5 block text-slate-500">
                      Será redirigido a la página de pago en <strong>{secondsLeft}</strong> segundos…
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* The pass sits below payment on purpose. Printing it calls off the
              countdown — a family part-way through a printout should not have
              the page pulled out from under them. */}
          <div className="mt-10">
            <ShipVisitPass
              code={(savedId || "").slice(0, 8).toUpperCase() || "—"}
              visitDate={chosen ? chosen.visit_date : ""}
              visitTime={chosen ? chosen.visit_time : null}
              ship={chosen ? chosen.ship : null}
              quince={`${f.quince_first} ${f.quince_last}`.trim()}
              people={passPeople}
              phoneDisplay={invitation.office.phoneDisplay}
              phoneDial={invitation.office.phoneDial}
              onPrint={cancelRedirect}
            />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main>
        <Section className="bg-white">
          <div className="mx-auto max-w-2xl">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold-600">Ship Visit</p>
              <h1 className="mt-3 font-display text-3xl font-bold text-royal-800 sm:text-4xl">
                Ship Visit Registration
              </h1>
              <p className="mt-3 text-slate-600">
                Come aboard and see the ship before you sail. Everyone attending must be registered
                with the exact name on the photo ID they will bring to the port. Every adult needs
                their own email address; anyone under 18 uses their guardian’s.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Todos deben presentar la misma identificación con foto que ingresen aquí. Cada
                adulto necesita su propio correo electrónico; los menores de 18 usan el de su tutor.
              </p>
            </div>

            <form onSubmit={onSubmit} className="mt-10 space-y-8">
              <input type="text" tabIndex={-1} aria-hidden="true" className="hidden"
                     value={f.botField} onChange={(e) => set("botField")(e.target.value)} />

              {/* The question that shapes the rest of the form.
                  Asked as "is she already registered?" rather than "are you
                  registering her?" — the first version made "yes" read as
                  "yes, register her again", which is the opposite of what it
                  did. The answer people give here is a fact they already know,
                  not a decision about this form. */}
              <fieldset>
                <legend className="font-display text-xl font-semibold text-royal-800">
                  Is the quinceañera already registered for this visit?
                </legend>
                <p className="mt-1 text-sm text-slate-500">
                  ¿La quinceañera ya está registrada para esta visita?
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      already: false,
                      en: "No — not yet",
                      es: "No — todavía no",
                      note: "We will register her and her guests together.",
                      noteEs: "La registramos a ella y a sus invitados juntos.",
                      icon: "crown",
                    },
                    {
                      already: true,
                      en: "Yes — she is registered",
                      es: "Sí — ya está registrada",
                      note: "We will only add the guests you name below.",
                      noteEs: "Solo agregamos los invitados que escribas abajo.",
                      icon: "users",
                    },
                  ].map((opt) => {
                    const selected = withQuince === !opt.already;
                    return (
                      <button
                        key={String(opt.already)}
                        type="button"
                        onClick={() => setWithQuince(!opt.already)}
                        aria-pressed={selected}
                        className={`group relative overflow-hidden rounded-2xl border-2 p-5 pr-12 text-left transition ${
                          selected
                            ? "border-royal-500 bg-gradient-to-br from-royal-50 to-blush-50 shadow-sm"
                            : "border-blush-200 bg-white hover:border-royal-300 hover:bg-blush-50/40"
                        }`}
                      >
                        <span
                          className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition ${
                            selected ? "bg-royal-600 text-white" : "bg-blush-100 text-royal-500"
                          }`}
                        >
                          <Icon name={opt.icon} className="h-5 w-5" />
                        </span>

                        <span className="mt-3 block font-display text-lg font-semibold text-royal-800">
                          {opt.en}
                        </span>
                        <span className="mt-0.5 block text-sm text-slate-500">{opt.es}</span>
                        <span className="mt-2 block text-sm text-slate-600">{opt.note}</span>
                        <span className="mt-0.5 block text-xs text-slate-400">{opt.noteEs}</span>

                        {/* The tick that says which one you are on. */}
                        <span
                          aria-hidden="true"
                          className={`absolute right-4 top-4 inline-flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
                            selected
                              ? "border-royal-600 bg-royal-600 text-white"
                              : "border-blush-300 bg-white text-transparent group-hover:border-royal-300"
                          }`}
                        >
                          <Icon name="check" className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Which visit */}
              <fieldset className="space-y-4">
                <legend className="font-display text-xl font-semibold text-royal-800">
                  Which ship visit
                </legend>
                {visits === null ? (
                  <p className="text-slate-500">Loading available dates…</p>
                ) : visits.length === 0 ? (
                  <p className="rounded-xl bg-gold-100/60 px-4 py-3 text-sm text-slate-700 ring-1 ring-gold-200">
                    No ship visits are open for registration right now. Please call us at{" "}
                    <a href={`tel:+${invitation.office.phoneDial}`} className="font-medium text-royal-600">
                      {invitation.office.phoneDisplay}
                    </a>{" "}
                    and we will let you know the next date.
                  </p>
                ) : (
                  <div>
                    <label className={label} htmlFor="visit">
                      Ship Visit Date <span className="text-rosa-500">*</span>
                    </label>
                    <select id="visit" className={input} required value={f.visit_id}
                            onChange={(e) => set("visit_id")(e.target.value)}>
                      <option value="">Fecha de Visita al Barco</option>
                      {visits.map((v) => (
                        <option key={v.id} value={v.id} disabled={v.remaining <= 0}>
                          {visitLabel(v)}
                          {/* Full dates have to say so or a family fills the whole
                              form only to be turned away. How full is nobody's
                              business but the office's. */}
                          {v.remaining <= 0 ? " — FULL / LLENO" : ""}
                        </option>
                      ))}
                    </select>
                    {chosen && (
                      <p className={`mt-2 text-sm ${wontFit ? "font-semibold text-rosa-600" : "text-slate-500"}`}>
                        {wontFit
                          ? `There is not enough room left on this date for ${partySize} people. Please pick another date, or call us and we will see what we can do.`
                          : `You are registering ${partySize} ${partySize === 1 ? "person" : "people"}.`}
                      </p>
                    )}
                    {/* The cost, while they are still deciding — not sprung on
                        them at the end. It is billed to her cabin, never
                        collected here, so the form takes no payment. */}
                    {chosen && !wontFit && chosen.price_per_person > 0 && (
                      <p className="mt-2 text-sm text-slate-600">
                        ${chosen.price_per_person.toFixed(2)} per person —{" "}
                        <strong className="text-royal-800">
                          ${(partySize * chosen.price_per_person).toFixed(2)}
                        </strong>{" "}
                        total. You’ll be able to pay right after you register.
                        <span className="mt-0.5 block text-xs text-slate-500">
                          ${chosen.price_per_person.toFixed(2)} por persona. Podrá pagar justo después
                          de registrarse.
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </fieldset>

              {/* The quinceañera — full details, or just her name for reference */}
              <fieldset className="space-y-4">
                <legend className="font-display text-xl font-semibold text-royal-800">
                  Quinceañera
                </legend>
                {!withQuince && (
                  <p className="rounded-xl bg-blush-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-blush-200">
                    You said she is already registered, so we only need her name here — it tells us
                    whose group these guests belong to. She will not be counted twice.
                    <span className="mt-1 block text-slate-500">
                      Solo necesitamos su nombre para saber a qué grupo pertenecen estos invitados.
                    </span>
                  </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="qf" en="First Name" es="Nombre" required value={f.quince_first} onChange={set("quince_first")} />
                  <Field id="ql" en="Last Name" es="Apellido" required value={f.quince_last} onChange={set("quince_last")} />
                  {withQuince && (
                    <>
                      <Field id="qd" en="Date of Birth" es="Fecha de Nacimiento" required type="date" value={f.quince_dob} onChange={set("quince_dob")} />
                      <Field id="qe" en="Email Address" es="Correo Electrónico" required type="email"
                             value={f.quince_email} onChange={set("quince_email")}
                             bad={duplicateEmail?.who === "quince"}
                             hint={duplicateEmail?.who === "quince" ? "This address is already used by another adult on this form." : "Her guardian\u2019s address is fine"} />
                      <Field id="qt" en="Type of ID" es="Tipo de Identificación" required options={ID_TYPES} value={f.quince_id_type} onChange={set("quince_id_type")} />
                      <Field id="qn" en="ID #" es="Número de Identificación" required value={f.quince_id_number} onChange={set("quince_id_number")} />
                    </>
                  )}
                </div>
              </fieldset>

              {/* Guest 1 */}
              <fieldset className="space-y-4">
                <legend className="font-display text-xl font-semibold text-royal-800">
                  Guest #1{!withQuince && <span className="text-base font-normal text-slate-400"> — first person you are adding</span>}
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="g1f" en="First Name" es="Nombre del Primer Invitado" required={!withQuince} value={f.guest1_first} onChange={set("guest1_first")} />
                  <Field id="g1l" en="Last Name" es="Apellido del Primer Invitado" required={hasG1} value={f.guest1_last} onChange={set("guest1_last")} />
                  <Field id="g1d" en="Date of Birth" es="Fecha de Nacimiento" required={hasG1} type="date" value={f.guest1_dob} onChange={set("guest1_dob")} />
                  <Field id="g1e" en="Email Address" es="Correo Electrónico" required={hasG1} type="email"
                         value={f.guest1_email} onChange={set("guest1_email")}
                         bad={duplicateEmail?.who === "guest1"}
                         hint={duplicateEmail?.who === "guest1" ? "This address is already used by another adult on this form." : "Their own address \u2014 a minor may use their guardian\u2019s"} />
                  <Field id="g1t" en="Type of ID" es="Tipo de Identificación" required={hasG1} options={ID_TYPES} value={f.guest1_id_type} onChange={set("guest1_id_type")} />
                  <Field id="g1n" en="Guest #1 ID" es="ID del Invitado #1" required={hasG1} value={f.guest1_id_number} onChange={set("guest1_id_number")} />
                </div>
              </fieldset>

              {/* Guest 2 — optional */}
              <fieldset className="space-y-4">
                <legend className="font-display text-xl font-semibold text-royal-800">
                  Guest #2 <span className="text-base font-normal text-slate-400">(optional / opcional)</span>
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="g2f" en="First Name" es="Nombre del Segundo Invitado" value={f.guest2_first} onChange={set("guest2_first")} />
                  <Field id="g2l" en="Last Name" es="Apellido del Segundo Invitado" required={hasG2} value={f.guest2_last} onChange={set("guest2_last")} />
                  <Field id="g2d" en="Date of Birth" es="Fecha de Nacimiento" required={hasG2} type="date" value={f.guest2_dob} onChange={set("guest2_dob")} />
                  <Field id="g2e" en="Email Address" es="Correo Electrónico" required={hasG2} type="email"
                         value={f.guest2_email} onChange={set("guest2_email")}
                         bad={duplicateEmail?.who === "guest2"}
                         hint={duplicateEmail?.who === "guest2" ? "This address is already used by another adult on this form." : undefined} />
                  <Field id="g2t" en="Type of ID" es="Tipo de Identificación" required={hasG2} options={ID_TYPES} value={f.guest2_id_type} onChange={set("guest2_id_type")} />
                  <Field id="g2n" en="Guest #2 ID" es="ID del Invitado #2" required={hasG2} value={f.guest2_id_number} onChange={set("guest2_id_number")} />
                </div>
              </fieldset>

              {/* The cruise */}
              <fieldset className="space-y-4">
                <legend className="font-display text-xl font-semibold text-royal-800">
                  Your cruise
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={label} htmlFor="sail">
                      Sail Date <span className="text-rosa-500">*</span>
                    </label>
                    <input id="sail" className={input} required list="sailList" autoComplete="off"
                           placeholder="Fecha de Salida" value={f.sail_date}
                           onChange={(e) => set("sail_date")(e.target.value)} />
                    <datalist id="sailList">
                      {sailings.map((s) => <option key={s.id} value={`${s.label} · ${s.ship}`} />)}
                    </datalist>
                  </div>
                  <Field id="cell" en="Cell Phone" es="Teléfono Celular" required type="tel" value={f.cell_phone} onChange={set("cell_phone")} />
                  <Field id="agent" en="Agent" es="Agente" required options={AGENTS} value={f.agent} onChange={set("agent")} />
                </div>
                <div>
                  <label className={label} htmlFor="notes">
                    Notes <span className="font-normal text-slate-400">(optional / opcional)</span>
                  </label>
                  <textarea id="notes" rows={3} className={input} placeholder="Notas"
                            value={f.notes} onChange={(e) => set("notes")(e.target.value)} />
                </div>
              </fieldset>

              {duplicateEmail && (
                <p role="alert" className="rounded-xl bg-rosa-50 px-4 py-3 text-center text-sm font-medium text-rosa-600 ring-1 ring-rosa-200">
                  {duplicateEmail.email} is entered twice. Each adult needs their own email address —
                  only a minor may share their guardian’s.
                  <span className="mt-1 block font-normal">
                    Cada adulto necesita su propio correo electrónico; solo un menor puede usar el de
                    su tutor.
                  </span>
                </p>
              )}
              {noPeople && (
                <p role="alert" className="rounded-xl bg-gold-100/60 px-4 py-3 text-center text-sm text-slate-700 ring-1 ring-gold-200">
                  Add at least one guest below, or choose “Yes — she is coming too” above.
                </p>
              )}
              {error && (
                <p role="alert" className="rounded-xl bg-rosa-50 px-4 py-3 text-center text-sm font-medium text-rosa-600 ring-1 ring-rosa-200">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "submitting" || wontFit || noPeople || !!duplicateEmail || !visits?.length}
                className="w-full rounded-full bg-gradient-to-r from-rosa-500 to-royal-500 px-8 py-4 font-semibold text-white shadow-lg shadow-royal-800/20 disabled:opacity-60"
              >
                {status === "submitting"
                  ? "Sending… / Enviando…"
                  : `Register ${partySize || ""} ${partySize === 1 ? "person" : "people"} / Registrar`}
              </button>
            </form>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
