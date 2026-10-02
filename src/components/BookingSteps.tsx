import { say } from "../lib/inviteLang";

const STEPS = [
  say("Review the available cabin prices.", "Revise los precios de las cabinas disponibles."),
  say(
    "Complete the Happy Holidays Travel reservation form.",
    "Complete el formulario de reservación de Happy Holidays Travel.",
  ),
  say("Submit the required deposit.", "Envíe el depósito requerido."),
];

export default function BookingSteps() {
  return (
    <div className="mx-auto max-w-3xl">
      <ol className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <li
            key={step}
            className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-blush-200"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rosa-400 to-royal-500 font-display text-lg font-bold text-white">
              {i + 1}
            </span>
            <p className="mt-3 text-sm font-medium text-royal-800">{step}</p>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-center text-sm text-slate-600">
        {say(
          "A Happy Holidays Travel agent will contact you to confirm your cabin, pricing and payment schedule.",
          "Un agente de Happy Holidays Travel se comunicará con usted para confirmar su cabina, el precio y el plan de pagos.",
        )}
      </p>
    </div>
  );
}
