import { invitation } from "../data/invitation";
import { say } from "../lib/inviteLang";
import { datesEs, itineraryEs } from "../lib/spanish";
import Icon from "./Icon";
import Section from "./Section";

interface DetailCard {
  icon: string;
  label: string;
  value: string;
}

export default function CruiseDetails() {
  const { cruise } = invitation;

  const cards: DetailCard[] = [
    { icon: "ship", label: say("Ship", "Barco"), value: `${cruise.ship} — ${cruise.line}` },
    {
      icon: "calendar",
      label: say("Sailing Dates", "Fechas del Crucero"),
      value: say(cruise.sailingDates, datesEs(cruise.sailingDates)),
    },
    {
      icon: "moon",
      label: say("Length", "Duración"),
      value: say(
        `${cruise.nights} Nights · ${cruise.itineraryName}`,
        `${cruise.nights} Noches · ${itineraryEs(cruise.itineraryName)}`,
      ),
    },
    { icon: "anchor", label: say("Departure Port", "Puerto de Salida"), value: cruise.departurePort },
  ];

  return (
    <Section id="details" className="bg-blush-50">
      <h2 className="text-center font-display text-3xl font-bold text-royal-800 sm:text-4xl">
        {say("Cruise Details", "Detalles del Crucero")}
      </h2>

      <div className="mt-10 grid items-center gap-10 lg:grid-cols-5 lg:gap-14">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-3xl shadow-lg shadow-royal-800/10 ring-1 ring-blush-200">
            <img
              src={cruise.shipImage}
              alt={cruise.shipImageAlt}
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
            />
          </div>
          <p className="mt-3 text-center text-sm text-slate-500">
            {cruise.ship} · {cruise.line}
          </p>
        </div>

        <div className="lg:col-span-3">
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((c) => (
              <div
                key={c.label}
                className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-blush-200"
              >
                <span className="mt-0.5 rounded-full bg-royal-50 p-2.5 text-royal-600">
                  <Icon name={c.icon} className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">
                    {c.label}
                  </p>
                  <p className="mt-1 font-medium text-royal-800">{c.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-blush-200">
            <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">
              {say("Destinations", "Destinos")}
            </p>
            <ul className="mt-3 flex flex-wrap gap-2.5">
              {cruise.destinations.map((d) => (
                <li
                  key={d}
                  className="inline-flex items-center gap-1.5 rounded-full bg-rosa-100 px-4 py-2 text-sm font-medium text-rosa-600"
                >
                  <Icon name="mapPin" className="h-4 w-4" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}
