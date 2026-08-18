// English / Spanish for the hub.
//
// The families using this page are split between the two, and the hub is the
// one page a girl is sent and expected to work through on her own — so it gets
// a real toggle rather than the English-label-Spanish-placeholder pairing the
// forms use.
//
// Scoped to the hub deliberately. Translating the whole site is a bigger job
// and half-translating it is worse than not starting; this is the page that
// needed it.

import { useEffect, useState } from "react";

export type Lang = "en" | "es";

const KEY = "hht_hub_lang";

/** Her choice, remembered per device. Defaults to the browser's language. */
export function useHubLang(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>(() => {
    // ?lang=es wins, so an agent can send a Spanish-speaking family a link
    // that opens in Spanish rather than telling them to find the toggle.
    const asked = new URLSearchParams(window.location.search).get("lang");
    if (asked === "en" || asked === "es") return asked;
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "en" || saved === "es") return saved;
    } catch {
      /* storage blocked — fall through to the browser's setting */
    }
    return typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("es")
      ? "es"
      : "en";
  });

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* not worth failing over */
    }
  };

  return [lang, setLang];
}

/** say("Guest list", "Lista de invitados") — reads in place, next to the copy. */
export function makeSay(lang: Lang) {
  return (en: string, es: string) => (lang === "es" ? es : en);
}
