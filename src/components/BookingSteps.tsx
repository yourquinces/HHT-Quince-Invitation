const STEPS = [
  "Review the available cabin prices.",
  "Complete the Happy Holidays Travel reservation form.",
  "Submit the required deposit.",
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
        A Happy Holidays Travel agent will contact you to confirm your cabin, pricing and payment
        schedule.
      </p>
    </div>
  );
}
