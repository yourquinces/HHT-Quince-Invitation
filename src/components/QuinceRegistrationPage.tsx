// Quinceañera Registration Form — /register, or /i/<slug>/register from her hub.
//
// Filled in once, after she books, so the office knows who she is: how to reach
// her, who she wants to sit with at dinner, her socials, school and team. When
// it is opened from her hub the slug ties the answers to her invitation and her
// name and sail date arrive prefilled, so there is less to type on a phone.

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { invitation } from "../data/invitation";
import { sailings } from "../data/sailings";
import { fetchInvitationRow } from "../lib/liveInvitation";
import QuinceAvatar from "./QuinceAvatar";
import { submitQuinceRegistration } from "../lib/quinceRegistration";
import type { QuinceRegistration } from "../lib/quinceRegistration";
import Header from "./Header";
import Footer from "./Footer";
import Icon from "./Icon";
import PrimaryButton from "./PrimaryButton";

type Status = "idle" | "submitting" | "success" | "error";

const inputClass =
  "w-full rounded-xl border border-blush-200 bg-white px-4 py-3.5 text-slate-800 placeholder:text-slate-400 focus:border-royal-400";
const labelClass = "mb-1.5 block text-sm font-semibold text-royal-800";
const OTHER_SAIL = "__other";

const SOCIALS = ["Instagram", "TikTok", "Snapchat", "Facebook", "WhatsApp", "Other"];

interface Fields {
  firstName: string;
  lastName: string;
  cell: string;
  email: string;
  sailDate: string;
  sailOther: string;
  sitWith: string; // "" | "yes" | "no"
  sitWithNames: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  snapchat: string;
  favoriteSocial: string;
  whatsapp: string; // "" | "yes" | "no"
  highSchool: string;
  gradYear: string;
  onTeam: string; // "" | "yes" | "no"
  teamName: string;
  parentName: string;
  parentInstagram: string;
  botField: string;
}

const INITIAL: Fields = {
  firstName: "", lastName: "", cell: "", email: "",
  sailDate: "", sailOther: "", sitWith: "", sitWithNames: "",
  instagram: "", facebook: "", tiktok: "", snapchat: "",
  favoriteSocial: "", whatsapp: "", highSchool: "", gradYear: "",
  onTeam: "", teamName: "", parentName: "", parentInstagram: "",
  botField: "",
};

/** Yes/No pair styled like the rest of the form. */
function YesNo({
  name, value, onChange, label, required,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  label: string;
  required?: boolean;
}) {
  return (
    <fieldset>
      <legend className={labelClass}>
        {label} {required && <span className="text-rosa-500">*</span>}
      </legend>
      <div className="flex gap-3">
        {["yes", "no"].map((v) => (
          <label
            key={v}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold capitalize ${
              value === v
                ? "border-royal-500 bg-royal-50 text-royal-800"
                : "border-blush-200 bg-white text-slate-600"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={v}
              checked={value === v}
              onChange={() => onChange(v)}
              required={required}
              className="sr-only"
            />
            {v === "yes" ? "Yes" : "No"}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function QuinceRegistrationPage({ slug }: { slug?: string }) {
  const [girlPhoto, setGirlPhoto] = useState<string | null>(null);
  const [f, setF] = useState<Fields>(INITIAL);
  const [status, setStatus] = useState<Status>("idle");
  const [girlName, setGirlName] = useState("");

  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    document.title = "Quinceañera Registration Form | Happy Holidays Travel";
    if (!slug) return;
    let cancelled = false;
    fetchInvitationRow(slug)
      .then((r) => {
        if (cancelled || !r) return;
        setGirlName(r.preferred_name);
        setGirlPhoto(r.profile_image_url ?? null);
        const parts = (r.quinceanera_name || "").trim().split(/\s+/);
        setF((p) => ({
          ...p,
          firstName: p.firstName || parts[0] || "",
          lastName: p.lastName || parts.slice(1).join(" ") || "",
          sailDate:
            p.sailDate ||
            (r.sail_date && sailings.some((s) => s.id === r.sail_date)
              ? r.sail_date
              : r.sailing_dates
                ? OTHER_SAIL
                : ""),
          sailOther: p.sailOther || (r.sail_date ? "" : r.sailing_dates || ""),
        }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;
    if (f.botField) return; // honeypot
    setStatus("submitting");

    const chosen = sailings.find((s) => s.id === f.sailDate);
    const payload: QuinceRegistration = {
      invitation_slug: slug,
      first_name: f.firstName,
      last_name: f.lastName,
      cell_phone: f.cell,
      email: f.email,
      sail_date: f.sailDate === OTHER_SAIL ? f.sailOther : chosen ? chosen.label : f.sailDate,
      sit_with: f.sitWith === "yes",
      sit_with_names: f.sitWithNames,
      instagram: f.instagram,
      facebook: f.facebook,
      tiktok: f.tiktok,
      snapchat: f.snapchat,
      favorite_social: f.favoriteSocial,
      uses_whatsapp: f.whatsapp ? f.whatsapp === "yes" : undefined,
      high_school: f.highSchool,
      graduation_year: f.gradYear,
      on_team: f.onTeam ? f.onTeam === "yes" : undefined,
      team_name: f.teamName,
      parent_name: f.parentName,
      parent_instagram: f.parentInstagram,
    };

    try {
      await submitQuinceRegistration(payload);
      setStatus("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <>
        <Header />
        <main className="px-5 py-16 sm:px-8">
          <div className="mx-auto max-w-xl rounded-3xl bg-blush-50 p-8 text-center ring-1 ring-blush-200">
            <span className="inline-flex rounded-full bg-royal-600 p-3 text-white">
              <Icon name="check" className="h-6 w-6" />
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold text-royal-800">
              Thank you{f.firstName ? `, ${f.firstName}` : ""}!
            </h1>
            <p className="mt-3 text-slate-600">
              Your registration is in. Happy Holidays Travel has everything they need — we’ll be
              in touch as your cruise gets closer.
            </p>
            {slug && (
              <div className="mt-6">
                <PrimaryButton href={`/i/${encodeURIComponent(slug)}/hub`}>
                  Back to my hub
                </PrimaryButton>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            {/* Her own picture when the form is opened from her hub — the same
                one she set there, so the form reads as hers rather than as a
                stranger's questionnaire. Opened without a slug there is no
                girl to show, so nothing is drawn. */}
            {slug && (
              <div className="mb-5 flex justify-center">
                <QuinceAvatar src={girlPhoto} name={girlName} size={88} />
              </div>
            )}
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold-600">
              Happy Holidays Travel
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold text-royal-800 sm:text-4xl">
              Quinceañera Registration Form
            </h1>
            <p className="mt-3 text-slate-600">
              {girlName ? `Welcome, ${girlName}! ` : ""}
              Tell us a little about you so we can make your cruise everything you want it to be.
              It takes about two minutes.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6 rounded-3xl bg-blush-50 p-6 ring-1 ring-blush-200 sm:p-8"
          >
            <input
              type="text" tabIndex={-1} autoComplete="off" aria-hidden="true"
              value={f.botField} onChange={(e) => set("botField", e.target.value)}
              className="hidden"
            />

            {/* ---- Her ---- */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="qr-first" className={labelClass}>
                  Quinceañera First Name <span className="text-rosa-500">*</span>
                </label>
                <input id="qr-first" required value={f.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  placeholder="Primer Nombre" className={inputClass} />
              </div>
              <div>
                <label htmlFor="qr-last" className={labelClass}>
                  Quinceañera Last Name <span className="text-rosa-500">*</span>
                </label>
                <input id="qr-last" required value={f.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  placeholder="Primer Apellido" className={inputClass} />
              </div>
              <div>
                <label htmlFor="qr-cell" className={labelClass}>Quinceañera’s Cell Phone</label>
                <input id="qr-cell" type="tel" value={f.cell}
                  onChange={(e) => set("cell", e.target.value)}
                  placeholder="(305) 555-1234" className={inputClass} />
              </div>
              <div>
                <label htmlFor="qr-email" className={labelClass}>Quinceañera’s Email Address</label>
                <input id="qr-email" type="email" value={f.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@example.com" className={inputClass} />
              </div>
            </div>

            <div>
              <label htmlFor="qr-sail" className={labelClass}>
                Sail Date <span className="text-rosa-500">*</span>
              </label>
              <select id="qr-sail" required value={f.sailDate}
                onChange={(e) => set("sailDate", e.target.value)} className={inputClass}>
                <option value="">Fecha de Salida</option>
                {sailings.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} · {s.ship}
                  </option>
                ))}
                <option value={OTHER_SAIL}>Another date — I’ll type it</option>
              </select>
              {f.sailDate === OTHER_SAIL && (
                <input value={f.sailOther} required
                  onChange={(e) => set("sailOther", e.target.value)}
                  placeholder="Which sailing?" className={`${inputClass} mt-3`} />
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <YesNo
                name="sitWith" required value={f.sitWith}
                onChange={(v) => set("sitWith", v)}
                label="Do you have another Quinceañera that is a close friend or family member that you want to sit with at dinner?"
              />
              <div>
                <label htmlFor="qr-sitnames" className={labelClass}>
                  Name of the Quinceañera/s{" "}
                  <span className="font-normal text-slate-400">(if applicable)</span>
                </label>
                <input id="qr-sitnames" value={f.sitWithNames}
                  onChange={(e) => set("sitWithNames", e.target.value)} className={inputClass} />
              </div>
            </div>

            {/* ---- Socials ---- */}
            <div className="border-t border-blush-200 pt-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="qr-ig" className={labelClass}>Instagram Username</label>
                  <input id="qr-ig" value={f.instagram}
                    onChange={(e) => set("instagram", e.target.value)}
                    placeholder="@username" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="qr-fb" className={labelClass}>Facebook/Email Username</label>
                  <input id="qr-fb" value={f.facebook}
                    onChange={(e) => set("facebook", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="qr-tt" className={labelClass}>TikTok Username</label>
                  <input id="qr-tt" value={f.tiktok}
                    onChange={(e) => set("tiktok", e.target.value)}
                    placeholder="@username" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="qr-sc" className={labelClass}>Snapchat Username</label>
                  <input id="qr-sc" value={f.snapchat}
                    onChange={(e) => set("snapchat", e.target.value)} className={inputClass} />
                </div>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="qr-fav" className={labelClass}>Favorite Social Media</label>
                  <select id="qr-fav" value={f.favoriteSocial}
                    onChange={(e) => set("favoriteSocial", e.target.value)} className={inputClass}>
                    <option value="">Choose one</option>
                    {SOCIALS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <YesNo name="whatsapp" value={f.whatsapp}
                  onChange={(v) => set("whatsapp", v)} label="Do you use WhatsApp?" />
              </div>
            </div>

            {/* ---- School and team ---- */}
            <div className="space-y-5 border-t border-blush-200 pt-6">
              <div>
                <label htmlFor="qr-school" className={labelClass}>
                  What High School do you go to? Or plan on going to?
                </label>
                <input id="qr-school" value={f.highSchool}
                  onChange={(e) => set("highSchool", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="qr-grad" className={labelClass}>
                  What year do you graduate high school?
                </label>
                <input id="qr-grad" inputMode="numeric" value={f.gradYear}
                  onChange={(e) => set("gradYear", e.target.value)}
                  placeholder="2029" className={inputClass} />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <YesNo name="onTeam" value={f.onTeam} onChange={(v) => set("onTeam", v)}
                  label="Are you on a team? (Cheer/Dance/Sports)" />
                <div>
                  <label htmlFor="qr-team" className={labelClass}>
                    What team do you participate in?
                  </label>
                  <input id="qr-team" value={f.teamName}
                    onChange={(e) => set("teamName", e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* ---- Parent ---- */}
            <div className="space-y-5 border-t border-blush-200 pt-6">
              <div>
                <label htmlFor="qr-parent" className={labelClass}>Parent’s Name</label>
                <input id="qr-parent" value={f.parentName}
                  onChange={(e) => set("parentName", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="qr-parentig" className={labelClass}>Parent’s Instagram Username</label>
                <input id="qr-parentig" value={f.parentInstagram}
                  onChange={(e) => set("parentInstagram", e.target.value)}
                  placeholder="@username" className={inputClass} />
              </div>
            </div>

            {status === "error" && (
              <div role="alert"
                className="rounded-xl bg-rosa-100 p-4 text-sm text-rosa-600 ring-1 ring-rosa-200">
                Something went wrong saving that. Please try again, or call us at{" "}
                {invitation.office.phoneDisplay}.
              </div>
            )}

            <PrimaryButton type="submit" disabled={status === "submitting"} className="w-full sm:w-full">
              {status === "submitting" ? "Sending…" : "Submit my registration"}
            </PrimaryButton>
            <p className="text-center text-xs text-slate-500">
              Questions? Call Happy Holidays Travel at {invitation.office.phoneDisplay}.
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
