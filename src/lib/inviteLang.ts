// English / Spanish for the quinceañera invitation (/i/<slug>).
//
// Chosen by the link, not a toggle: the agent sends ?lang=es to a family whose
// guests read Spanish, and everyone they forward it to gets the same page.
// The /pricing page it links to is still English.

import { makeSay, type Lang } from "./hubLang";

export const inviteLang: Lang =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("lang") === "es"
    ? "es"
    : "en";

/** say("Cruise Details", "Detalles del Crucero") */
export const say = makeSay(inviteLang);
