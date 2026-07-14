import { invitation } from "../data/invitation";
import Icon from "./Icon";
import Section from "./Section";

export default function IncludedExperience() {
  const experiences = invitation.experiences.filter((e) => e.enabled);
  if (experiences.length === 0) return null;

  return (
    <Section className="bg-white">
      <h2 className="text-center font-display text-3xl font-bold text-royal-800 sm:text-4xl">
        What’s Included for Our Group
      </h2>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {experiences.map((exp) => (
          <div
            key={exp.title}
            className="rounded-2xl bg-blush-50 p-6 ring-1 ring-blush-200 transition hover:shadow-md"
          >
            <span className="inline-flex rounded-full bg-gradient-to-br from-rosa-100 to-royal-100 p-3 text-royal-600">
              <Icon name={exp.icon} className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold text-royal-800">{exp.title}</h3>
            {exp.description && <p className="mt-1.5 text-sm text-slate-600">{exp.description}</p>}
          </div>
        ))}
      </div>

      <div className="mx-auto mt-8 flex max-w-2xl items-start gap-3 rounded-2xl bg-gold-100/60 p-5 text-sm text-slate-700 ring-1 ring-gold-200">
        <span className="mt-0.5 shrink-0 text-gold-600">
          <Icon name="info" className="h-5 w-5" />
        </span>
        <p>{invitation.openBarNote}</p>
      </div>
    </Section>
  );
}
