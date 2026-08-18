// Ship Visit registration — /ship-visit
//
// Replaces the 123ContactForm. Same questions, with two differences that came
// out of how the old one was actually used:
//
//   · The visit date is picked from the dates the office has opened, not typed,
//     so a family cannot register for a tour that is not happening. Each date
//     shows how many spots are left and a full one cannot be chosen.
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

type Status = "idle" | "submitting" | "success" | "error";

const ID_TYPES = ["Passport", "Driver's License", "State ID", "School ID", "Birth Certificate", "Other"];
const AGENTS = ["Luisa", "Camila", "Isabel", "Keren", "Sergio", "Beatriz", "Maurice", "Other"];

const input =
  "w-full rounded-xl border border-blush-200 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-royal-400";
const label = "mb-1.5 block text-sm font-semibold text-royal-800";

function Field({
  id, en, es, required, type = "text", value, onChange, options,
}: {
  id: string; en: string; es: string; required?: boolean; type?: string;
  value: string; onChange: (v: string) => void; options?: string[];
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
        <input id={id} type={type} className={input} required={required} placeholder={es}
               value={value} onChange={(e) => onChange(e.target.value)}
               {...(type === "date" ? {} : { autoComplete: "off" })} />
      )}
    </div>
  );
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

  // The party is the quinceañera plus whichever guests were filled in, and the
  // number shown here has to match what the server counts.
  const partySize = useMemo(
    () => 1 + (f.guest1_first.trim() ? 1 : 0) + (f.guest2_first.trim() ? 1 : 0),
    [f.guest1_first, f.guest2_first],
  );
  const chosen = visits?.find((v) => v.id === f.visit_id);
  const wontFit = !!chosen && partySize > chosen.remaining;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (f.botField) return;
    setStatus("submitting");
    setError("");
    try {
      const { botField, ...payload } = f;
      const res = await submitShipVisit(payload);
      if (!res.ok) {
        setError(res.error || "Could not save that. Please try again.");
        setStatus("error");
        fetchShipVisits().then(setVisits).catch(() => {});   // refresh spot counts
        return;
      }
      setStatus("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Something went wrong. Please try again, or call the office.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <>
        <Header />
        <main className="px-5 py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold-600">
            Ship Visit
          </p>
          <h1 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-bold text-royal-800 sm:text-4xl">
            You’re registered — see you on board!
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-slate-600">
            We have {partySize} {partySize === 1 ? "person" : "people"} down for{" "}
            {chosen ? visitLabel(chosen) : "your ship visit"}. Bring the same photo ID you
            entered here — the port will ask for it. Questions? Call us at{" "}
            <a href={`tel:+${invitation.office.phoneDial}`} className="font-medium text-royal-600">
              {invitation.office.phoneDisplay}
            </a>
            .
          </p>
          <p className="mx-auto mt-6 max-w-xl text-sm text-slate-500">
            Traiga la misma identificación con foto que ingresó aquí — el puerto se la pedirá.
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
        <Section className="bg-white">
          <div className="mx-auto max-w-2xl">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold-600">
                Ship Visit
              </p>
              <h1 className="mt-3 font-display text-3xl font-bold text-royal-800 sm:text-4xl">
                Ship Visit Registration
              </h1>
              <p className="mt-3 text-slate-600">
                Come aboard and see the ship before you sail. Everyone attending must be
                registered with the exact name on the photo ID they will bring to the port.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Regístrese para visitar el barco. Todos deben presentar la misma identificación
                con foto que ingresen aquí.
              </p>
            </div>

            <form onSubmit={onSubmit} className="mt-10 space-y-8">
              <input type="text" tabIndex={-1} aria-hidden="true" className="hidden"
                     value={f.botField} onChange={(e) => set("botField")(e.target.value)} />

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
                          {v.remaining <= 0
                            ? " — FULL / LLENO"
                            : ` — ${v.remaining} spot${v.remaining === 1 ? "" : "s"} left`}
                        </option>
                      ))}
                    </select>
                    {chosen && (
                      <p className={`mt-2 text-sm ${wontFit ? "font-semibold text-rosa-600" : "text-slate-500"}`}>
                        {wontFit
                          ? `Only ${chosen.remaining} spot${chosen.remaining === 1 ? "" : "s"} left on this date and you have ${partySize} people. Please pick another date or call us.`
                          : `${chosen.remaining} of ${chosen.capacity} spots left. You are registering ${partySize} ${partySize === 1 ? "person" : "people"}.`}
                      </p>
                    )}
                  </div>
                )}
              </fieldset>

              {/* The quinceañera */}
              <fieldset className="space-y-4">
                <legend className="font-display text-xl font-semibold text-royal-800">
                  Quinceañera
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="qf" en="First Name" es="Nombre" required value={f.quince_first} onChange={set("quince_first")} />
                  <Field id="ql" en="Last Name" es="Apellido" required value={f.quince_last} onChange={set("quince_last")} />
                  <Field id="qd" en="Date of Birth" es="Fecha de Nacimiento" required type="date" value={f.quince_dob} onChange={set("quince_dob")} />
                  <Field id="qe" en="Email Address" es="Correo Electrónico" type="email" value={f.quince_email} onChange={set("quince_email")} />
                  <Field id="qt" en="Type of ID" es="Tipo de Identificación" required options={ID_TYPES} value={f.quince_id_type} onChange={set("quince_id_type")} />
                  <Field id="qn" en="ID #" es="Número de Identificación" required value={f.quince_id_number} onChange={set("quince_id_number")} />
                </div>
              </fieldset>

              {/* Guest 1 */}
              <fieldset className="space-y-4">
                <legend className="font-display text-xl font-semibold text-royal-800">
                  Guest #1
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="g1f" en="First Name" es="Nombre del Primer Invitado" required value={f.guest1_first} onChange={set("guest1_first")} />
                  <Field id="g1l" en="Last Name" es="Apellido del Primer Invitado" required value={f.guest1_last} onChange={set("guest1_last")} />
                  <Field id="g1d" en="Date of Birth" es="Fecha de Nacimiento" required type="date" value={f.guest1_dob} onChange={set("guest1_dob")} />
                  <Field id="g1e" en="Email Address" es="Correo Electrónico" type="email" value={f.guest1_email} onChange={set("guest1_email")} />
                  <Field id="g1t" en="Type of ID" es="Tipo de Identificación" required options={ID_TYPES} value={f.guest1_id_type} onChange={set("guest1_id_type")} />
                  <Field id="g1n" en="Guest #1 ID" es="ID del Invitado #1" required value={f.guest1_id_number} onChange={set("guest1_id_number")} />
                </div>
              </fieldset>

              {/* Guest 2 — optional */}
              <fieldset className="space-y-4">
                <legend className="font-display text-xl font-semibold text-royal-800">
                  Guest #2 <span className="text-base font-normal text-slate-400">(optional / opcional)</span>
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="g2f" en="First Name" es="Nombre del Segundo Invitado" value={f.guest2_first} onChange={set("guest2_first")} />
                  <Field id="g2l" en="Last Name" es="Apellido del Segundo Invitado" value={f.guest2_last} onChange={set("guest2_last")} />
                  <Field id="g2d" en="Date of Birth" es="Fecha de Nacimiento" type="date" value={f.guest2_dob} onChange={set("guest2_dob")} />
                  <Field id="g2e" en="Email Address" es="Correo Electrónico" type="email" value={f.guest2_email} onChange={set("guest2_email")} />
                  <Field id="g2t" en="Type of ID" es="Tipo de Identificación" options={ID_TYPES} value={f.guest2_id_type} onChange={set("guest2_id_type")} />
                  <Field id="g2n" en="Guest #2 ID" es="ID del Invitado #2" value={f.guest2_id_number} onChange={set("guest2_id_number")} />
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
                      {sailings.map((s) => (
                        <option key={s.id} value={`${s.label} · ${s.ship}`} />
                      ))}
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

              {error && (
                <p role="alert" className="rounded-xl bg-rosa-50 px-4 py-3 text-center text-sm font-medium text-rosa-600 ring-1 ring-rosa-200">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "submitting" || wontFit || !visits?.length}
                className="w-full rounded-full bg-gradient-to-r from-rosa-500 to-royal-500 px-8 py-4 font-semibold text-white shadow-lg shadow-royal-800/20 disabled:opacity-60"
              >
                {status === "submitting" ? "Sending… / Enviando…" : "Register / Registrar"}
              </button>
            </form>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
