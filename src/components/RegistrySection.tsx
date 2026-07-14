import { invitation } from "../data/invitation";
import Icon from "./Icon";
import Section from "./Section";

export default function RegistrySection() {
  const { registry, quinceanera } = invitation;
  if (!registry.enabled || !registry.url) return null;

  const heading = registry.heading || `${quinceanera.preferredName}’s Gift Registry`;

  return (
    <Section id="registry" className="bg-blush-50">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-blush-200 sm:p-10">
        <span className="inline-flex rounded-full bg-rosa-100 p-3.5 text-rosa-500">
          <Icon name="gift" className="h-7 w-7" />
        </span>
        <h2 className="mt-5 font-display text-2xl font-bold text-royal-800 sm:text-3xl">
          {heading}
        </h2>
        <p className="mt-4 text-slate-600">{registry.description}</p>
        <div className="mt-7 flex justify-center">
          <a
            href={registry.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rosa-500 to-royal-500 px-10 py-4 text-sm font-semibold uppercase tracking-wider text-white shadow-lg shadow-rosa-500/25 transition hover:from-rosa-600 hover:to-royal-600 sm:w-auto"
          >
            <Icon name="gift" className="h-4 w-4" />
            {registry.buttonLabel}
          </a>
        </div>
      </div>
    </Section>
  );
}
