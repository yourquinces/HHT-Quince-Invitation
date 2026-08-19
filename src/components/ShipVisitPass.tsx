// The ship visit pass — what a family walks to the terminal with.
//
// Deliberately NOT called a receipt. A ship visit is free, so there is nothing
// to receipt, and a document that reads like proof of purchase in the hands of
// someone who has not booked a cruise is the one genuinely risky thing about
// handing out paperwork at this stage. It says what it is on its face: a pass
// to visit a ship, and not a booking.
//
// Three rules it follows, all learned elsewhere in this codebase:
//   · No money on it at all. The $20 a head is billed to the quinceañera's
//     cabin and settled on her balance like everything else; a number printed
//     here would only invite somebody to arrive at the pier expecting to pay
//     it, or to read the pass as an invoice. The charge belongs on the cabin,
//     which is the one place it is actually reconciled.
//   · ID TYPE only, never the number. The port matches names against the
//     manifest we send them; the family only needs to know which card to bring.
//     These parties include minors and this is a page people photograph.
//   · Same pass whether or not they have booked. A booked family still needs
//     the date and the ID rule, and two documents would be two to maintain.

export interface PassPerson {
  who: string;
  name: string;
  idType: string | null;
}

export interface ShipVisitPassProps {
  /** Short confirmation code — first 8 of the registration id, as Cozumel does. */
  code: string;
  visitDate: string;
  visitTime: string | null;
  ship: string | null;
  /** Whose group this is. Shown as the group label, not as an attendee. */
  quince: string;
  people: PassPerson[];
  phoneDisplay: string;
  phoneDial: string;
}

function prettyDate(iso: string): string {
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  if (!y) return String(iso);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

export default function ShipVisitPass(p: ShipVisitPassProps) {
  return (
    <>
      {/* Printing has to reach outside this component — the pass is rendered
          inside a page that also carries a header, a footer and (on the staff
          side) the whole monitor. Hiding by visibility rather than display
          keeps the pass in its own place on the sheet. */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #ship-visit-pass, #ship-visit-pass * { visibility: visible; }
          #ship-visit-pass {
            position: absolute; left: 0; top: 0; width: 100%;
            box-shadow: none !important; border-radius: 0 !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div id="ship-visit-pass"
           className="mx-auto max-w-lg overflow-hidden rounded-2xl bg-white ring-1 ring-blush-200 print:ring-0">
        <div className="bg-gradient-to-r from-royal-600 to-rosa-500 px-6 py-5 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/80">
            Happy Holidays Travel
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold">Ship Visit Pass</h2>
          <p className="text-sm text-white/90">Pase de Visita al Barco</p>
        </div>

        <div className="px-6 py-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Visit</p>
              <p className="font-display text-lg font-semibold text-royal-800">
                {prettyDate(p.visitDate)}
              </p>
              <p className="text-sm text-slate-600">
                {[p.visitTime, p.ship].filter(Boolean).join(" · ") || " "}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Confirmation</p>
              <p className="font-mono text-lg font-bold text-royal-800">#{p.code}</p>
            </div>
          </div>

          {p.quince && (
            <p className="mt-4 rounded-lg bg-blush-50 px-3 py-2 text-sm text-slate-600">
              Quinceañera group: <span className="font-semibold text-royal-800">{p.quince}</span>
            </p>
          )}

          {/* Names and which card to bring. No ID numbers — see the file note. */}
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-blush-200 text-[10px] uppercase tracking-widest text-slate-400">
                <th className="py-2">Attending</th>
                <th className="py-2">Bring this ID</th>
              </tr>
            </thead>
            <tbody>
              {p.people.map((x, i) => (
                <tr key={i} className="border-b border-blush-100 last:border-0">
                  <td className="py-2">
                    <span className="font-semibold text-slate-800">{x.name}</span>
                    <span className="ml-2 text-xs text-slate-400">{x.who}</span>
                  </td>
                  <td className="py-2 text-slate-700">{x.idType || "Photo ID"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-5 rounded-xl bg-gold-100/60 px-4 py-3 text-sm text-slate-700 ring-1 ring-gold-200">
            <p className="font-semibold">
              Everyone must bring the exact photo ID listed above. The port will ask for it.
            </p>
            <p className="mt-1 text-slate-600">
              Cada persona debe traer la identificación con foto indicada arriba. El puerto se la pedirá.
            </p>
          </div>

          {/* Deliberately silent on money — see the note at the top of this
              file. Says what the pass IS, and nothing about what it cost. */}
          <p className="mt-4 text-center text-xs text-slate-500">
            This pass is for a ship visit only. It is not a cruise booking.
            <span className="mt-0.5 block">
              Este pase es solo para visitar el barco. No es una reserva de crucero.
            </span>
          </p>

          <p className="mt-4 text-center text-sm text-slate-600">
            Questions? Call{" "}
            <a href={`tel:+${p.phoneDial}`} className="font-semibold text-royal-600">
              {p.phoneDisplay}
            </a>
          </p>
        </div>
      </div>

      <div className="no-print mt-5 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-royal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-royal-700"
        >
          🖨 Print / Save PDF
        </button>
      </div>
    </>
  );
}
