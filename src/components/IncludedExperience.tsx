import { invitation } from "../data/invitation";
import { say } from "../lib/inviteLang";
import Icon from "./Icon";
import Section from "./Section";

// Spanish for the cards in invitation.ts, keyed by their English title.
const EXPERIENCES_ES: Record<string, { title: string; description: string }> = {
  "Three Private Celebrations": {
    title: "Tres Celebraciones Privadas",
    description: "Eventos exclusivos reservados solo para nuestro grupo.",
  },
  "Professional DJ & Entertainment": {
    title: "DJ Profesional y Entretenimiento",
    description: "Música y entretenimiento en cada celebración.",
  },
  "Open Bar for Adults 21+": {
    title: "Barra Libre para Adultos de 21+",
    description: "Disponible durante los eventos privados del grupo.",
  },
  "Beverages for Minors": {
    title: "Bebidas para Menores",
    description: "Bebidas sin alcohol para nuestros invitados más jóvenes.",
  },
  "Special Quinceañera Activities": {
    title: "Actividades Especiales de Quinceañera",
    description: "Momentos creados especialmente para la quinceañera.",
  },
  "Memories with Family & Friends": {
    title: "Recuerdos con Familia y Amigos",
    description: "Una semana única juntos en alta mar.",
  },
};

export default function IncludedExperience() {
  const experiences = invitation.experiences.filter((e) => e.enabled);
  if (experiences.length === 0) return null;

  return (
    <Section className="bg-white">
      <h2 className="text-center font-display text-3xl font-bold text-royal-800 sm:text-4xl">
        {say("What’s Included for Our Group", "Qué Incluye Nuestro Grupo")}
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
            <h3 className="mt-4 font-display text-lg font-semibold text-royal-800">
              {say(exp.title, EXPERIENCES_ES[exp.title]?.title ?? exp.title)}
            </h3>
            {exp.description && (
              <p className="mt-1.5 text-sm text-slate-600">
                {say(exp.description, EXPERIENCES_ES[exp.title]?.description ?? exp.description)}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mx-auto mt-8 flex max-w-2xl items-start gap-3 rounded-2xl bg-gold-100/60 p-5 text-sm text-slate-700 ring-1 ring-gold-200">
        <span className="mt-0.5 shrink-0 text-gold-600">
          <Icon name="info" className="h-5 w-5" />
        </span>
        <p>
          {say(
            invitation.openBarNote,
            "La barra libre está disponible solo para invitados de 21 años o más. Habrá bebidas sin alcohol para los menores.",
          )}
        </p>
      </div>
    </Section>
  );
}
