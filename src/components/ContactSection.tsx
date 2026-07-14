import { invitation } from "../data/invitation";
import Icon from "./Icon";
import Section from "./Section";

export default function ContactSection() {
  const { agent, office } = invitation;

  const actions = [
    { icon: "phone", label: "Call", href: `tel:+${agent.phoneDial}` },
    { icon: "whatsapp", label: "WhatsApp", href: agent.whatsappUrl },
    { icon: "mail", label: "Email", href: `mailto:${agent.email}` },
  ];

  return (
    <Section id="contact" className="bg-white">
      <h2 className="text-center font-display text-3xl font-bold text-royal-800 sm:text-4xl">
        Questions? We’re Here to Help
      </h2>

      <div className="mx-auto mt-10 max-w-xl rounded-3xl bg-blush-50 p-8 text-center ring-1 ring-blush-200">
        {agent.photo && (
          <img
            src={agent.photo}
            alt={`${agent.name}, Happy Holidays Travel agent`}
            className="mx-auto mb-4 h-24 w-24 rounded-full object-cover shadow-md"
            loading="lazy"
          />
        )}
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-600">
          Your Happy Holidays Travel Agent
        </p>
        <p className="mt-2 font-display text-2xl font-semibold text-royal-800">{agent.name}</p>
        <p className="mt-1 text-slate-600">{agent.phoneDisplay}</p>
        <p className="text-slate-600">{agent.email}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {actions.map((a) => (
            <a
              key={a.label}
              href={a.href}
              target={a.href.startsWith("http") ? "_blank" : undefined}
              rel={a.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-royal-600 px-6 py-3.5 text-sm font-semibold text-white shadow transition hover:bg-royal-700"
            >
              <Icon name={a.icon} className="h-4 w-4" />
              {a.label}
            </a>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-xl text-center text-sm leading-relaxed text-slate-500">
        <p className="font-semibold text-royal-800">{office.name}</p>
        <p>{office.addressLine1}</p>
        <p>{office.addressLine2}</p>
        <p>
          <a href={`tel:+${office.phoneDial}`} className="hover:text-royal-600">
            {office.phoneDisplay}
          </a>
          {" · "}
          <a
            href={office.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-royal-600"
          >
            {office.website}
          </a>
        </p>
      </div>
    </Section>
  );
}
