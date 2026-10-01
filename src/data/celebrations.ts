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
  /** Big line under her name, e.g. "70th Birthday". */
  occasion: string;
  /** ISO sail date — must match an id in sailings.ts. */
  sailDate: string;
  message: string;
  signature: string;
  /** Only Camila or Luisa — see the agent rule in the README. */
  agentName: string;
}

export const celebrations: Record<string, Celebration> = {
  "amandita-70": {
    honoree: "Amandita",
    occasion: "70th Birthday",
    sailDate: "2027-07-24",
    message:
      "Amandita is turning 70, and we are celebrating at sea! Join her family and friends " +
      "for a week aboard Icon of the Seas — sunshine, great food, beautiful ports and many " +
      "reasons to toast to seventy wonderful years. It would mean the world to have you with us.",
    signature: "With love, Amandita’s family",
    agentName: "Luisa",
  },
};
