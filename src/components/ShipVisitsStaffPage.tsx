// Ship visits — staff view at /staff/ship-visits?key=…
//
// Two jobs on one page, because they are the same job in practice: open the
// dates, then watch them fill. Same shared staff key as the other /staff pages,
// checked server-side.

import { useEffect, useMemo, useState } from "react";
import {
  deleteShipVisitPerson,
  fetchShipVisitsStaff,
  moveShipVisitRegistration,
  saveShipVisit,
  setShipVisitField,
} from "../lib/shipVisits";
import type { ShipVisitRegistration, StaffShipVisit, StaffShipVisitData, Who, WhoOrParty } from "../lib/shipVisits";
import Header from "./Header";
import Footer from "./Footer";
import ShipVisitPass from "./ShipVisitPass";
import { invitation } from "../data/invitation";

type State = "loading" | "denied" | "ready";

const input =
  "w-full rounded-lg border border-blush-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-royal-400";

function pretty(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  if (!y) return String(iso);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

const person = (first: string | null, last: string | null) =>
  [first, last].filter(Boolean).join(" ").trim();

/* ── The port manifest ──────────────────────────────────────────────────────
   Royal Caribbean asks for one row per person in a fixed shape. Three of its
   columns are the same on every row we will ever send, so they are constants
   here rather than questions on the form — a family cannot tell us anything
   useful about them, and each extra required field costs submissions.
   ────────────────────────────────────────────────────────────────────────── */
const REASON_FOR_BOARDING = "IC Ship Tour";
const COMPANY = "Happy Holidays Travel";
const DEFAULT_CITIZENSHIP = "USA";
// Same list the public form offers, so a corrected row cannot end up with an
// ID type the family could never have chosen.
const ID_TYPES = ["Passport", "Driver's License", "State ID", "School ID", "Birth Certificate", "Other"];

/** Our ID labels in Royal Caribbean's vocabulary. Anything that is not a
 *  passport or a driver's licence is a government ID as far as the manifest is
 *  concerned — that covers state ID, school ID and birth certificate. */
function rclIdType(label: string | null): string {
  const v = (label ?? "").trim().toLowerCase();
  if (!v) return "";
  if (v.startsWith("passport")) return "PASSPORT";
  if (v.includes("driver")) return "DRIVER_LICENSE";
  return "GOVERNMENT_ID";
}

/** Digits only, and without the US country code — the sample manifest is bare
 *  10-digit numbers, and families type them every way imaginable. */
function barePhone(v: string | null): string {
  const d = (v ?? "").replace(/\D/g, "");
  return d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
}

/** Every attendee on a registration, flattened — this is what the port needs.
 *  She is only an attendee when she was registered on that form; otherwise her
 *  name is just the label for whose group the guests belong to.
 *
 *  Mobile is the registration's one cell phone repeated down the party: the
 *  form asks for a single number for the family, and the manifest wants a
 *  reachable number against each name rather than a unique one. Email, by
 *  contrast, IS per person — the form has required that since the second pass,
 *  and an earlier version of this export sent the quinceañera's address for
 *  every guest, which made the whole column useless. */
function attendees(r: ShipVisitRegistration) {
  const mobile = barePhone(r.cell_phone);
  const rows: {
    key: Who; who: string; first: string | null; last: string | null; name: string;
    dob: string | null; idType: string | null; id: string | null; idExp: string | null;
    email: string | null; mobile: string; citizenship: string | null;
  }[] = [
    ...(r.registering_quince === false
      ? []
      : [{
          key: "quince" as Who, who: "Quinceañera",
          first: r.quince_first, last: r.quince_last, name: person(r.quince_first, r.quince_last),
          dob: r.quince_dob, idType: r.quince_id_type, id: r.quince_id_number, idExp: r.quince_id_expiration,
          email: r.quince_email, mobile, citizenship: r.quince_citizenship,
        }]),
    {
      key: "guest1", who: "Guest 1",
      first: r.guest1_first, last: r.guest1_last, name: person(r.guest1_first, r.guest1_last),
      dob: r.guest1_dob, idType: r.guest1_id_type, id: r.guest1_id_number, idExp: r.guest1_id_expiration,
      email: r.guest1_email, mobile, citizenship: r.guest1_citizenship,
    },
    {
      key: "guest2", who: "Guest 2",
      first: r.guest2_first, last: r.guest2_last, name: person(r.guest2_first, r.guest2_last),
      dob: r.guest2_dob, idType: r.guest2_id_type, id: r.guest2_id_number, idExp: r.guest2_id_expiration,
      email: r.guest2_email, mobile, citizenship: r.guest2_citizenship,
    },
    {
      key: "guest3", who: "Guest 3",
      first: r.guest3_first, last: r.guest3_last, name: person(r.guest3_first, r.guest3_last),
      dob: r.guest3_dob, idType: r.guest3_id_type, id: r.guest3_id_number, idExp: r.guest3_id_expiration,
      email: r.guest3_email, mobile, citizenship: r.guest3_citizenship,
    },
  ];
  return rows.filter((x) => x.name);
}

function csvCell(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function ShipVisitsStaffPage() {
  const key = new URLSearchParams(window.location.search).get("key") ?? "";
  const [state, setState] = useState<State>("loading");
  const [data, setData] = useState<StaffShipVisitData | null>(null);
  const [openVisit, setOpenVisit] = useState<string | null>(null);
  const [editing, setEditing] = useState<StaffShipVisit | null>(null);
  const [draft, setDraft] = useState({ visit_date: "", visit_time: "", ship: "", capacity: "50", notes: "", active: true, price: "20" });
  const [saving, setSaving] = useState(false);
  // Which registration's pass is open, if any. Families lose theirs, and
  // agents register people over the phone who never saw the success screen.
  const [pass, setPass] = useState<ShipVisitRegistration | null>(null);

  async function load() {
    if (!key) { setState("denied"); return; }
    try {
      setData(await fetchShipVisitsStaff(key));
      setState("ready");
    } catch {
      setState("denied");
    }
  }

  useEffect(() => {
    document.title = "Ship Visits | HHT Staff";
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const byVisit = useMemo(() => {
    const m = new Map<string, ShipVisitRegistration[]>();
    for (const r of data?.registrations ?? []) {
      const k = r.visit_id ?? "none";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    }
    return m;
  }, [data]);

  function startNew() {
    setEditing({ id: "", visit_date: "", visit_time: "", ship: "", capacity: 50, booked: 0, active: true, notes: "", price_per_person: 20 });
    setDraft({ visit_date: "", visit_time: "", ship: "", capacity: "50", notes: "", active: true, price: "20" });
  }
  function startEdit(v: StaffShipVisit) {
    setEditing(v);
    setDraft({
      visit_date: v.visit_date, visit_time: v.visit_time ?? "", ship: v.ship ?? "",
      capacity: String(v.capacity), notes: v.notes ?? "", active: v.active,
      price: String(v.price_per_person ?? 20),
    });
  }

  async function persist() {
    if (!draft.visit_date) return;
    setSaving(true);
    const res = await saveShipVisit(key, {
      id: editing?.id || null,
      visit_date: draft.visit_date,
      visit_time: draft.visit_time,
      ship: draft.ship,
      capacity: Number(draft.capacity) || 0,
      active: draft.active,
      notes: draft.notes,
      price_per_person: Number(draft.price) || 0,
    });
    setSaving(false);
    if (!res.ok) { alert(res.error || "Could not save that date."); return; }
    setEditing(null);
    load();
  }

  /** The file Royal Caribbean asks for, in their column order, ready to send.
   *  Nothing here should need editing in Excel first — that was the point. */
  function exportCSV(visit: StaffShipVisit) {
    const regs = byVisit.get(visit.id) ?? [];
    const header = [
      "Last Name", "First Name", "Date of Birth", "Citizenship", "ID Type",
      "ID Number", "Mobile", "Email", "Reason for Boarding", "Company", "Quinceañera",
    ];
    const lines = [header.join(",")];
    for (const r of regs) {
      // Whose group this is — her name is on the registration whether or not she
      // is attending on it, which is exactly what makes it able to label every row.
      const quince = person(r.quince_first, r.quince_last);
      for (const a of attendees(r)) {
        lines.push([
          a.last ?? "", a.first ?? "", a.dob ?? "",
          a.citizenship || DEFAULT_CITIZENSHIP,
          rclIdType(a.idType), a.id ?? "", a.mobile, a.email ?? "",
          REASON_FOR_BOARDING, COMPANY, quince,
        ].map(csvCell).join(","));
      }
    }
    const blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ship-visit-${visit.visit_date}-manifest.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  }

  /** Citizenship is the one manifest column staff ever have to touch, so it is
   *  edited in place in the table rather than behind a form. Saved on blur, and
   *  written back into local state so the next export uses it without a reload. */
  /* Every roster cell saves on blur, the way the citizenship box already did.
     The manifest goes to the port and has to match the document each person
     actually brings, so a typo in a passport number or a surname has to be
     fixable here — re-registering the family instead would double-count the
     capacity.

     The database normalises (names up, emails down) and returns what it
     stored, so we show that rather than what was typed. Clearing a name
     removes a person and changes the headcount, which is computed
     server-side, so those two fields re-read instead of patching state. */
  const [savingCell, setSavingCell] = useState<string | null>(null);

  async function saveField(regId: string, who: WhoOrParty, field: string, value: string) {
    const token = `${regId}:${who}:${field}`;
    setSavingCell(token);
    const res = await setShipVisitField(key, regId, who, field, value);
    setSavingCell(null);
    if (!res.ok) {
      alert(res.error || "Could not save that.");
      await load();
      return;
    }
    if (field === "first" || field === "last") { await load(); return; }
    const col = who === "party" ? field : `${who}_${field}`;
    setData((prev) => prev && {
      ...prev,
      registrations: prev.registrations.map((r) =>
        r.id === regId ? { ...r, [col]: res.value ?? null } : r),
    });
  }

  /* Removing a person is a real deletion, not a hide: the manifest goes to the
     port and a name on it that is not boarding is a problem at the gate. The
     database decides whether the party row survives — the last person out
     takes the row with them — so the reply drives whether we drop the whole
     registration from the roster or just blank that person. */
  const [removing, setRemoving] = useState<string | null>(null);

  async function removePerson(reg: ShipVisitRegistration, who: Who, name: string) {
    const others = attendees(reg).filter((a) => a.key !== who).length;
    const warning = others === 0
      ? `Remove ${name}?\n\nThey are the last person on this registration, so the whole booking will be deleted and the spot freed.`
      : `Remove ${name} from this ship visit?\n\nThe other ${others === 1 ? "person" : `${others} people`} on this booking stay.`;
    if (!window.confirm(`${warning}\n\nThis cannot be undone.`)) return;

    const token = `${reg.id}:${who}`;
    setRemoving(token);
    const res = await deleteShipVisitPerson(key, reg.id, who);
    setRemoving(null);
    if (!res.ok) { alert(res.error || "Could not remove that person."); return; }
    // Re-read rather than patching state by hand: this changes party_size,
    // the visit's booked count and the spots-left figure, and those are
    // computed server-side.
    await load();
  }

  /* Moving a family to another date is a move of the ROW, not a re-registration:
     the id survives, so the pass code, the cabin link and everyone on the
     booking come with it. Agents were otherwise removing three people and
     typing them back in on the new date, which changed the pass code and
     double-counted the capacity while both versions existed.

     The database owns the two rules — room on the new date, and one email per
     adult on it — so this asks and reports rather than pre-judging. The one
     thing decided here is which dates are worth OFFERING: a date without room
     for this whole party is shown greyed rather than hidden, because an agent
     needs to see that it exists and is full. */
  const [moveReg, setMoveReg] = useState<ShipVisitRegistration | null>(null);
  const [movingTo, setMovingTo] = useState<string | null>(null);

  async function moveTo(reg: ShipVisitRegistration, visitId: string) {
    setMovingTo(visitId);
    const res = await moveShipVisitRegistration(key, reg.id, visitId);
    setMovingTo(null);
    if (!res.ok) { alert(res.error || "Could not move that booking."); return; }
    setMoveReg(null);
    // Both dates' booked counts and spots-left change, and both are computed
    // server-side, so re-read rather than patching two cards by hand.
    await load();
  }

  if (state === "loading") {
    return (<><Header /><main className="px-5 py-20"><p className="text-center font-display text-2xl text-royal-800">Loading…</p></main><Footer /></>);
  }
  if (state === "denied") {
    return (
      <><Header />
        <main className="px-5 py-20 text-center">
          <h1 className="font-display text-2xl font-semibold text-royal-800">Staff only</h1>
          <p className="mx-auto mt-3 max-w-md text-slate-600">
            This page needs the staff link. Use the one on the HHT Staff Information page — it includes the key.
          </p>
        </main><Footer /></>
    );
  }

  const visits = data?.visits ?? [];
  const upcoming = visits.filter((v) => v.visit_date >= new Date().toISOString().slice(0, 10));

  return (
    <>
      <Header />
      <main className="px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold-600">Staff</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-3xl font-bold text-royal-800">Ship Visits</h1>
            <button onClick={startNew}
                    className="rounded-full bg-royal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-royal-700">
              + Add a visit date
            </button>
          </div>
          <p className="mt-1 text-slate-600">
            {upcoming.length} upcoming {upcoming.length === 1 ? "visit" : "visits"} ·{" "}
            {data?.registrations.length ?? 0} registrations ·{" "}
            {(data?.registrations ?? []).reduce((s, r) => s + r.party_size, 0)} people in total
          </p>

          {/* Add / edit a date */}
          {editing && (
            <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-blush-200">
              <h2 className="font-display text-lg font-semibold text-royal-800">
                {editing.id ? "Edit visit" : "New visit"}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="text-sm">Date
                  <input type="date" className={input} value={draft.visit_date}
                         onChange={(e) => setDraft({ ...draft, visit_date: e.target.value })} />
                </label>
                <label className="text-sm">Time <span className="text-slate-400">(free text)</span>
                  <input className={input} placeholder="10:00 AM" value={draft.visit_time}
                         onChange={(e) => setDraft({ ...draft, visit_time: e.target.value })} />
                </label>
                <label className="text-sm">Ship
                  <input className={input} placeholder="ICON" value={draft.ship}
                         onChange={(e) => setDraft({ ...draft, ship: e.target.value })} />
                </label>
                <label className="text-sm">Capacity <span className="text-slate-400">(people)</span>
                  <input type="number" min={0} className={input} value={draft.capacity}
                         onChange={(e) => setDraft({ ...draft, capacity: e.target.value })} />
                </label>
                {/* Per date, not global: an already-billed visit keeps its own
                    price when the rate changes. */}
                <label className="text-sm">Price per person
                  <input type="number" min={0} step="1" className={input} value={draft.price}
                         onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
                </label>
                <label className="text-sm sm:col-span-2">Notes
                  <input className={input} value={draft.notes}
                         onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
                </label>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={draft.active}
                       onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
                Open for registration — families can pick this date on the form
              </label>
              <div className="mt-4 flex gap-2">
                <button onClick={persist} disabled={saving || !draft.visit_date}
                        className="rounded-full bg-royal-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  {saving ? "Saving…" : "Save"}
                </button>
                <button onClick={() => setEditing(null)}
                        className="rounded-full border border-blush-200 px-5 py-2 text-sm font-semibold text-slate-600">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {visits.length === 0 ? (
            <p className="mt-12 text-center text-slate-500">
              No visit dates yet. Add one and it appears on the registration form straight away.
            </p>
          ) : (
            <div className="mt-8 space-y-3">
              {visits.map((v) => {
                const regs = byVisit.get(v.id) ?? [];
                const pct = v.capacity ? Math.min(100, Math.round((v.booked / v.capacity) * 100)) : 0;
                const full = v.booked >= v.capacity;
                const open = openVisit === v.id;
                return (
                  <section key={v.id} className="rounded-2xl bg-white p-5 ring-1 ring-blush-200">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="font-display text-xl font-semibold text-royal-800">
                          {pretty(v.visit_date)}
                          {v.visit_time ? ` · ${v.visit_time}` : ""}
                          {v.ship ? ` · ${v.ship}` : ""}
                        </h2>
                        <p className="mt-0.5 text-sm text-slate-500">
                          {!v.active && <span className="mr-2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">Closed</span>}
                          {regs.length} {regs.length === 1 ? "registration" : "registrations"}
                          {` · $${Number(v.price_per_person ?? 0).toFixed(0)} per person`}
                          {v.notes ? ` · ${v.notes}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`font-display text-2xl font-bold ${full ? "text-rosa-600" : "text-royal-800"}`}>
                          {v.booked} <span className="text-base font-normal text-slate-400">of {v.capacity}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {full ? "Full" : `${v.capacity - v.booked} spots left`}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-blush-100">
                      <div className={`h-full rounded-full ${full ? "bg-rosa-500" : "bg-royal-500"}`}
                           style={{ width: `${pct}%` }} />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => setOpenVisit(open ? null : v.id)}
                              className="rounded-full border border-blush-200 px-4 py-1.5 text-xs font-semibold text-royal-700 hover:border-royal-400">
                        {open ? "Hide people" : `Show people (${regs.reduce((s, r) => s + r.party_size, 0)})`}
                      </button>
                      <button onClick={() => startEdit(v)}
                              className="rounded-full border border-blush-200 px-4 py-1.5 text-xs font-semibold text-royal-700 hover:border-royal-400">
                        Edit date
                      </button>
                      <button onClick={() => exportCSV(v)} disabled={!regs.length}
                              className="rounded-full border border-blush-200 px-4 py-1.5 text-xs font-semibold text-royal-700 hover:border-royal-400 disabled:opacity-40">
                        ⬇ RCL manifest
                      </button>
                    </div>

                    {open && (
                      <div className="mt-4 overflow-x-auto">
                        {regs.length === 0 ? (
                          <p className="text-sm text-slate-500">Nobody registered for this date yet.</p>
                        ) : (
                          <table className="w-full min-w-[1250px] text-left text-sm">
                            <thead>
                              <tr className="border-b border-blush-200 text-xs uppercase tracking-wider text-slate-500">
                                <th className="py-2 pr-3">Name</th>
                                <th className="py-2 pr-3">Who</th>
                                <th className="py-2 pr-3">Date of birth</th>
                                <th className="py-2 pr-3">Cit.</th>
                                <th className="py-2 pr-3">ID type</th>
                                <th className="py-2 pr-3">ID number</th>
                                <th className="py-2 pr-3">ID expires</th>
                                <th className="py-2 pr-3">Email</th>
                                <th className="py-2 pr-3">Phone</th>
                                <th className="py-2 pr-3">Agent</th>
                                {/* Pinned: the table is wider than the card, and an
                                    action nobody can scroll to is an action nobody has. */}
                                <th className="sticky right-0 min-w-[250px] bg-white py-2 pl-3 text-right shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.15)]">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {regs.map((r) =>
                                attendees(r).map((a, i) => {
                                  // No width here on purpose: each field sets its own, and a w-full in the
                                  // base competes with those at equal specificity, so Tailwind's
                                  // stylesheet order decides — which silently squashed every column.
                                  const cell = "rounded border border-transparent bg-transparent px-1.5 py-1 text-sm text-slate-700 hover:border-blush-200 focus:border-royal-400 focus:bg-white";
                                  const busy = (f: string) => savingCell === `${r.id}:${a.key}:${f}`;
                                  return (
                                  <tr key={`${r.id}-${a.key}`} className="border-b border-blush-100">
                                    <td className="py-1 pr-3">
                                      <div className="flex gap-1">
                                        <input defaultValue={a.first ?? ""} placeholder="First"
                                          aria-label={`First name for ${a.name}`} disabled={busy("first")}
                                          onBlur={(e) => { const v = e.target.value.trim();
                                            if (v !== (a.first ?? "")) saveField(r.id, a.key, "first", v); }}
                                          className={`${cell} w-28 font-medium uppercase`} />
                                        <input defaultValue={a.last ?? ""} placeholder="Last"
                                          aria-label={`Last name for ${a.name}`} disabled={busy("last")}
                                          onBlur={(e) => { const v = e.target.value.trim();
                                            if (v !== (a.last ?? "")) saveField(r.id, a.key, "last", v); }}
                                          className={`${cell} w-28 font-medium uppercase`} />
                                      </div>
                                    </td>
                                    <td className="py-1 pr-3 text-slate-500">{a.who}</td>
                                    <td className="py-1 pr-3">
                                      <input type="date" defaultValue={a.dob ?? ""}
                                        aria-label={`Date of birth for ${a.name}`} disabled={busy("dob")}
                                        onBlur={(e) => { const v = e.target.value;
                                          if (v !== (a.dob ?? "")) saveField(r.id, a.key, "dob", v); }}
                                        className={`${cell} w-36`} />
                                    </td>
                                    {/* Blank shows the USA the export will use, greyed, so an
                                        untouched row reads as "USA by default", not as missing. */}
                                    <td className="py-1 pr-3">
                                      <input defaultValue={a.citizenship ?? ""} placeholder={DEFAULT_CITIZENSHIP}
                                        maxLength={3} aria-label={`Citizenship for ${a.name}`} disabled={busy("citizenship")}
                                        onBlur={(e) => { const v = e.target.value.trim().toUpperCase(); e.target.value = v;
                                          if (v !== (a.citizenship ?? "")) saveField(r.id, a.key, "citizenship", v); }}
                                        className={`${cell} w-14 uppercase placeholder:normal-case placeholder:text-slate-400`} />
                                    </td>
                                    <td className="py-1 pr-3">
                                      <select defaultValue={a.idType ?? ""}
                                        aria-label={`ID type for ${a.name}`} disabled={busy("id_type")}
                                        onChange={(e) => saveField(r.id, a.key, "id_type", e.target.value)}
                                        className={`${cell} w-36`}>
                                        <option value="">—</option>
                                        {ID_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                      </select>
                                    </td>
                                    <td className="py-1 pr-3">
                                      <input defaultValue={a.id ?? ""} placeholder="—"
                                        aria-label={`ID number for ${a.name}`} disabled={busy("id_number")}
                                        onBlur={(e) => { const v = e.target.value.trim();
                                          if (v !== (a.id ?? "")) saveField(r.id, a.key, "id_number", v); }}
                                        className={`${cell} w-40`} />
                                    </td>
                                    <td className="py-1 pr-3">
                                      <input type="date" defaultValue={a.idExp ?? ""}
                                        aria-label={`ID expiration date for ${a.name}`} disabled={busy("id_expiration")}
                                        onBlur={(e) => { const v = e.target.value;
                                          if (v !== (a.idExp ?? "")) saveField(r.id, a.key, "id_expiration", v); }}
                                        className={`${cell} w-36`} />
                                    </td>
                                    <td className="py-1 pr-3">
                                      <input type="email" defaultValue={a.email ?? ""} placeholder="—"
                                        aria-label={`Email for ${a.name}`} disabled={busy("email")}
                                        onBlur={(e) => { const v = e.target.value.trim();
                                          if (v !== (a.email ?? "")) saveField(r.id, a.key, "email", v); }}
                                        className={`${cell} w-56`} />
                                    </td>
                                    {/* Phone and agent belong to the party, so only the first
                                        row of a booking edits them. */}
                                    <td className="py-1 pr-3">
                                      {i === 0 ? (
                                        <input defaultValue={r.cell_phone ?? ""} placeholder="—"
                                          aria-label="Phone for this booking" disabled={savingCell === `${r.id}:party:cell_phone`}
                                          onBlur={(e) => { const v = e.target.value.trim();
                                            if (v !== (r.cell_phone ?? "")) saveField(r.id, "party", "cell_phone", v); }}
                                          className={`${cell} w-32`} />
                                      ) : null}
                                    </td>
                                    <td className="py-1 pr-3">
                                      {i === 0 ? (
                                        <input defaultValue={r.agent ?? ""} placeholder="—"
                                          aria-label="Agent for this booking" disabled={savingCell === `${r.id}:party:agent`}
                                          onBlur={(e) => { const v = e.target.value.trim();
                                            if (v !== (r.agent ?? "")) saveField(r.id, "party", "agent", v); }}
                                          className={`${cell} w-24`} />
                                      ) : null}
                                    </td>
                                    <td className="sticky right-0 min-w-[250px] bg-white py-1 pl-3 shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.15)]">
                                      <div className="flex items-center justify-end gap-1.5">
                                        {/* Party-level, like the pass: a booking moves
                                            whole, never one guest out of a family. */}
                                        {i === 0 && (
                                          <button onClick={() => setMoveReg(r)}
                                                  title="Move this whole booking to another visit date"
                                                  className="rounded-full border border-blush-200 px-3 py-1 text-xs font-semibold text-royal-700 hover:border-royal-400">
                                            Move
                                          </button>
                                        )}
                                        {i === 0 && (
                                          <button onClick={() => setPass(r)}
                                                  className="rounded-full border border-blush-200 px-3 py-1 text-xs font-semibold text-royal-700 hover:border-royal-400">
                                            🖨 Pass
                                          </button>
                                        )}
                                        <button
                                          onClick={() => removePerson(r, a.key, a.name)}
                                          disabled={removing === `${r.id}:${a.key}`}
                                          title={`Remove ${a.name} from this ship visit`}
                                          aria-label={`Remove ${a.name} from this ship visit`}
                                          className="rounded-full border border-blush-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-rosa-400 hover:bg-rosa-50 hover:text-rosa-600 disabled:opacity-40"
                                        >
                                          {removing === `${r.id}:${a.key}` ? "…" : "Remove"}
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                  );
                                }),
                              )}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Move a booking to another date. Dates run earliest-first here rather
          than newest-first as the cards do — an agent moving a family is
          picking from what is coming up, not reviewing history. */}
      {moveReg && (() => {
        const from = visits.find((x) => x.id === moveReg.visit_id) ?? null;
        const people = attendees(moveReg);
        // A rejected party is holding no place, so nothing can be too full for it.
        const needsRoom = moveReg.status !== "rejected";
        const options = visits
          .filter((v) => v.id !== moveReg.visit_id)
          .slice()
          .sort((a, b) => a.visit_date.localeCompare(b.visit_date));
        const today = new Date().toISOString().slice(0, 10);
        return (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 px-4 py-10"
               onClick={() => movingTo || setMoveReg(null)}>
            <div onClick={(e) => e.stopPropagation()}
                 className="w-full max-w-lg rounded-2xl bg-white p-6 ring-1 ring-blush-200">
              <h2 className="font-display text-xl font-semibold text-royal-800">Move this booking</h2>
              <p className="mt-1 text-sm text-slate-600">
                {people.map((p) => p.name).join(", ")} — {moveReg.party_size}{" "}
                {moveReg.party_size === 1 ? "person" : "people"}
                {from ? `, currently on ${pretty(from.visit_date)}` : ""}.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Everyone on the booking moves together, and the pass code stays the same.
                {moveReg.reservation_id
                  ? " The $ charge on her cabin re-bills itself at the new date's price."
                  : ""}
              </p>

              {options.length === 0 ? (
                <p className="mt-6 text-sm text-slate-500">
                  There is nowhere to move it to — this is the only visit date. Add another one first.
                </p>
              ) : (
                <div className="mt-5 space-y-2">
                  {options.map((v) => {
                    const left = Math.max(v.capacity - v.booked, 0);
                    const fits = !needsRoom || moveReg.party_size <= left;
                    const busy = movingTo === v.id;
                    return (
                      <button key={v.id} disabled={!fits || !!movingTo}
                        onClick={() => moveTo(moveReg, v.id)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-blush-200 px-4 py-3 text-left transition hover:border-royal-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-blush-200">
                        <span>
                          <span className="block text-sm font-semibold text-royal-800">
                            {pretty(v.visit_date)}
                            {v.visit_time ? ` · ${v.visit_time}` : ""}
                            {v.ship ? ` · ${v.ship}` : ""}
                          </span>
                          <span className="block text-xs text-slate-500">
                            ${Number(v.price_per_person ?? 0).toFixed(0)} per person
                            {!v.active && " · closed to the public"}
                            {v.visit_date < today && " · past"}
                          </span>
                        </span>
                        <span className={`shrink-0 text-xs font-semibold ${fits ? "text-royal-700" : "text-rosa-600"}`}>
                          {busy ? "Moving…" : fits ? `${left} left` : `Full — ${left} left`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <button onClick={() => setMoveReg(null)} disabled={!!movingTo}
                        className="rounded-full border border-blush-200 px-5 py-2 text-sm font-semibold text-slate-600 disabled:opacity-50">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Reprint. Rendered over the page rather than on its own route so an
          agent never loses their place in the monitor. */}
      {pass && (() => {
        const v = visits.find((x) => x.id === pass.visit_id) ?? null;
        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 px-4 py-10"
               onClick={() => setPass(null)}>
            <div onClick={(e) => e.stopPropagation()}>
              <ShipVisitPass
                code={pass.id.slice(0, 8).toUpperCase()}
                visitDate={v ? v.visit_date : ""}
                visitTime={v ? v.visit_time : null}
                ship={v ? v.ship : null}
                quince={person(pass.quince_first, pass.quince_last)}
                people={attendees(pass).map((a) => ({ who: a.who, name: a.name, idType: a.idType }))}
                phoneDisplay={invitation.office.phoneDisplay}
                phoneDial={invitation.office.phoneDial}
              />
              <div className="no-print mt-3 flex justify-center">
                <button onClick={() => setPass(null)}
                        className="rounded-full bg-white/90 px-5 py-2 text-sm font-semibold text-slate-700">
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <Footer />
    </>
  );
}
