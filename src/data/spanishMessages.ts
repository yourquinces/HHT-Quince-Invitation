// Spanish versions of a family's own invitation message, keyed by slug.
//
// The message in the invitations table is whatever the family typed, so the
// ?lang=es page cannot translate it on its own. Add an entry here when an
// agent asks for a family's invitation in Spanish; without one, the Spanish
// page shows the family's message as they wrote it.

export const spanishMessages: Record<string, { message: string; signature: string }> = {
  "brianna-parrondo": {
    message:
      "¡Estamos celebrando un momento muy especial: los 15 años de Brianna! 💕🎉\n\n" +
      "Nos encantaría que nuestra familia y amigos nos acompañen a bordo del Icon of the Seas " +
      "para una celebración de cumpleaños inolvidable, llena de sol, diversión, risas y muchos " +
      "recuerdos juntos. 🥂🌴⚓️\n\n" +
      "Significaría muchísimo para nosotros tener a las personas que queremos celebrando este " +
      "momento tan especial con Brianna.",
    signature: "Con mucho cariño, la familia Parrondo",
  },
};
