// Group quinceañera invitations — /g/<slug>
//
// An invitation to the quinceañera cruise addressed to a whole organisation or
// community (a school, church, club…) rather than to one girl's family. It
// sells the quince cruise itself: families in the group book their own
// daughter's quinceañera on the sailing, travelling together.
//
// Unlike /celebrate/ these ARE quince pages, so leads go to `quince_leads`
// (source "group-invite:<slug>"). Unlike /c/<code> they are not tied to an
// invitation row, so there is no database entry — add one here and redeploy.
// Listed on /staff/hubs. Keep this file free of imports: the link-preview edge
// function imports it too.

export interface GroupInvite {
  /** How the group is named on the page, e.g. "LPM". */
  groupName: string;
  /** ISO sail date — must match an id in sailings.ts. */
  sailDate: string;
  message: string;
  signature: string;
  /** Only Camila or Luisa — see the agent rule in the README. */
  agentName: string;
}

export const groupInvites: Record<string, GroupInvite> = {
  lpm: {
    groupName: "LPM",
    sailDate: "2027-07-24",
    message:
      "We would love for the LPM family to sail together on our 2027 Quinceañera Cruise. " +
      "Celebrate your daughter's fifteen at sea alongside the families you already know — " +
      "private celebrations, a week of beautiful ports, and memories she will keep for a lifetime.",
    signature: "With love, Happy Holidays Travel",
    agentName: "Luisa",
  },
};
