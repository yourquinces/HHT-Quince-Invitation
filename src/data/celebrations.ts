// Celebration invitations — /celebrate/<slug>
//
// Birthdays, anniversaries and other parties that ride one of our group
// sailings but are NOT quinceañeras. They reuse the sailing's facts and live
// price sheets (matched by `sailDate`, the same ISO ids as sailings.ts) and
// nothing else: no quince wording, no registry, no hub, and leads go to the
// regular-cruise `leads` pipeline (hht-cruise-quote), never `quince_leads`.
//
// There is no database row — add an entry here and redeploy. Keep this file
// free of imports: the link-preview edge function imports it too.

export interface Celebration {
  /** Name as the guest of honour is known to her guests. */
  honoree: string;
  /** Big line under her name, in Spanish, e.g. "70 Cumpleaños". */
  occasion: string;
  /** ISO sail date — must match an id in sailings.ts. */
  sailDate: string;
  /** First person, from the guest of honour herself. Page is in Spanish. */
  message: string;
  signature: string;
  /** Only Camila or Luisa — see the agent rule in the README. */
  agentName: string;
}

export const celebrations: Record<string, Celebration> = {
  "amandita-70": {
    honoree: "Amandita",
    occasion: "70 Cumpleaños",
    sailDate: "2027-07-24",
    message:
      "¡Voy a cumplir 70 años y quiero celebrarlo en alta mar con ustedes! Los invito a " +
      "acompañarme una semana a bordo del Icon of the Seas: sol, buena comida, puertos " +
      "preciosos y muchos motivos para brindar por setenta años maravillosos. Tenerlos " +
      "conmigo sería el mejor regalo.",
    signature: "Con mucho cariño, Amandita",
    agentName: "Luisa",
  },
};
