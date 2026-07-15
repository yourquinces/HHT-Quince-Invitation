import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { invitation } from "../data/invitation";
import {
  fetchInvitationRow,
  updateInvitationByKey,
  uploadInvitationPhoto,
} from "../lib/liveInvitation";
import type { InvitationRow } from "../lib/liveInvitation";
import Header from "./Header";
import Footer from "./Footer";
import Icon from "./Icon";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";

type PageState = "loading" | "missing" | "form" | "saved";

const inputClass =
  "w-full rounded-xl border border-blush-200 bg-white px-4 py-3.5 text-slate-800 placeholder:text-slate-400 focus:border-royal-400";
const labelClass = "mb-1.5 block text-sm font-semibold text-royal-800";

const POSITION_OPTIONS = [
  { value: "center top", label: "Show the top of the photo (best for portraits)" },
  { value: "center", label: "Show the middle of the photo" },
  { value: "center bottom", label: "Show the bottom of the photo" },
];

/** No-login editor for the family: /i/<slug>/edit?key=<secret>. */
export default function FamilyEditPage({ slug }: { slug: string }) {
  const editKey = new URLSearchParams(window.location.search).get("key") ?? "";
  const [state, setState] = useState<PageState>("loading");
  const [row, setRow] = useState<InvitationRow | null>(null);
  const [message, setMessage] = useState("");
  const [signature, setSignature] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [position, setPosition] = useState("center top");
  const [registryUrl, setRegistryUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

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
        setMessage(r.family_message ?? "");
        setSignature(r.signature ?? "");
        setPhotoUrl(r.hero_image_url ?? "");
        setPosition(r.image_position || "center top");
        setRegistryUrl(r.registry_url ?? "");
        document.title = `Edit ${r.preferred_name}'s Invitation`;
        setState("form");
      })
      .catch(() => {
        if (!cancelled) setState("missing");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const onPickPhoto = (file: File | null) => {
    setPhotoFile(file);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(file ? URL.createObjectURL(file) : "");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      let heroUrl = photoUrl;
      if (photoFile) {
        if (photoFile.size > 5 * 1024 * 1024) {
          setError("That photo is larger than 5 MB. Please choose a smaller one.");
          setSaving(false);
          return;
        }
        heroUrl = await uploadInvitationPhoto(slug, photoFile);
      }
      const ok = await updateInvitationByKey(slug, editKey, {
        family_message: message,
        signature,
        hero_image_url: heroUrl,
        image_position: position,
        registry_url: registryUrl,
      });
      if (!ok) {
        setError(
          "This edit link is not valid. Please use the exact link Happy Holidays Travel sent you, or contact your agent.",
        );
        setSaving(false);
        return;
      }
      setPhotoUrl(heroUrl);
      setState("saved");
    } catch {
      setError("Something went wrong while saving. Please try again in a moment.");
    }
    setSaving(false);
  };

  const shownPhoto = photoPreview || photoUrl;

  return (
    <>
      <Header />
      <main className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-2xl">
          {state === "loading" && (
            <p role="status" className="text-center font-display text-2xl text-royal-800">
              Loading…
            </p>
          )}

          {state === "missing" && (
            <div className="text-center">
              <p className="font-display text-2xl font-semibold text-royal-800">
                We could not find this invitation.
              </p>
              <p className="mt-3 text-slate-600">
                Please double check the link, or contact Happy Holidays Travel at{" "}
                <a
                  href={`tel:+${invitation.office.phoneDial}`}
                  className="font-medium text-royal-600"
                >
                  {invitation.office.phoneDisplay}
                </a>
                .
              </p>
            </div>
          )}

          {state === "saved" && row && (
            <div className="rounded-3xl bg-blush-50 p-8 text-center ring-1 ring-blush-200">
              <span className="inline-flex rounded-full bg-royal-600 p-3 text-white">
                <Icon name="check" className="h-6 w-6" />
              </span>
              <p className="mt-4 font-display text-2xl font-semibold text-royal-800">
                Saved! The invitation is updated.
              </p>
              <p className="mt-2 text-slate-600">
                Your changes are live right now — take a look.
              </p>
              <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
                <PrimaryButton href={`/i/${encodeURIComponent(slug)}`}>
                  View the Invitation
                </PrimaryButton>
                <SecondaryButton onClick={() => setState("form")}>Keep Editing</SecondaryButton>
              </div>
            </div>
          )}

          {state === "form" && row && (
            <>
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold-600">
                  Family Editor
                </p>
                <h1 className="mt-3 font-display text-3xl font-bold text-royal-800 sm:text-4xl">
                  Edit {row.preferred_name}’s Invitation
                </h1>
                <p className="mt-3 text-slate-600">
                  Change the photo and message below — everything else on the invitation is
                  managed by Happy Holidays Travel. Your changes appear instantly.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-8 rounded-3xl bg-blush-50 p-6 ring-1 ring-blush-200 sm:p-8"
              >
                <div className="space-y-6">
                  <div>
                    <label className={labelClass}>
                      {row.preferred_name}’s photo{" "}
                      <span className="font-normal text-slate-400">
                        (a vertical phone photo works great)
                      </span>
                    </label>
                    {shownPhoto && (
                      <div className="mb-3 flex justify-center">
                        <div className="w-40 overflow-hidden rounded-2xl shadow-md ring-1 ring-blush-200">
                          <img
                            src={shownPhoto}
                            alt={`${row.preferred_name}'s invitation photo`}
                            className="aspect-[4/5] w-full object-cover"
                            style={{ objectPosition: position }}
                          />
                        </div>
                      </div>
                    )}
                    <input
                      ref={fileInput}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => onPickPhoto(e.target.files?.[0] ?? null)}
                      className="w-full rounded-xl border border-blush-200 bg-white px-4 py-3 text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-royal-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                    />
                  </div>

                  {shownPhoto && (
                    <div>
                      <label htmlFor="fe-position" className={labelClass}>
                        Photo framing
                      </label>
                      <select
                        id="fe-position"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        className={inputClass}
                      >
                        {POSITION_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label htmlFor="fe-message" className={labelClass}>
                      Welcome message to your guests
                    </label>
                    <textarea
                      id="fe-message"
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={invitation.invitationMessage}
                      className={inputClass}
                    />
                    <p className="mt-1.5 text-xs text-slate-500">
                      Leave empty to use the message shown above.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="fe-signature" className={labelClass}>
                      Signed with love{" "}
                      <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      id="fe-signature"
                      type="text"
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      placeholder="With love, the Garcia family"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="fe-registry" className={labelClass}>
                      Gift registry link{" "}
                      <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      id="fe-registry"
                      type="url"
                      value={registryUrl}
                      onChange={(e) => setRegistryUrl(e.target.value)}
                      placeholder="https://quinces-registry.netlify.app/r/..."
                      className={inputClass}
                    />
                    <p className="mt-1.5 text-xs text-slate-500">
                      Paste your registry link from the HHT Quince Gift Registry and a Gift
                      Registry section appears on the invitation.
                    </p>
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="mt-6 rounded-xl bg-rosa-100 p-4 text-sm text-rosa-600 ring-1 ring-rosa-200"
                  >
                    {error}
                  </div>
                )}

                <div className="mt-7">
                  <PrimaryButton type="submit" disabled={saving} className="w-full sm:w-full">
                    {saving ? "Saving…" : "Save Changes"}
                  </PrimaryButton>
                </div>
                <p className="mt-4 text-center text-xs text-slate-500">
                  Questions? Call Happy Holidays Travel at {invitation.office.phoneDisplay}.
                </p>
              </form>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
