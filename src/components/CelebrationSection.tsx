import { invitation } from "../data/invitation";
import Icon from "./Icon";

export default function CelebrationSection() {
  const { celebration } = invitation;
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-royal-700 via-royal-800 to-royal-900 px-5 py-16 text-center sm:px-8 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 right-0 h-72 w-72 rounded-full bg-rosa-400/20 blur-3xl"
      />
      <div className="relative mx-auto max-w-3xl">
        <div className="mb-5 flex justify-center text-gold-300">
          <Icon name="sparkles" className="h-8 w-8" />
        </div>
        <h2 className="font-display text-3xl font-bold leading-snug text-white sm:text-4xl">
          {celebration.heading}
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-royal-100">{celebration.description}</p>
      </div>
    </section>
  );
}
