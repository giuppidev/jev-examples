import { typeSafeAi } from "@ai-sdk/typesafe-ai";
import { experimental_evaluate as evaluate } from "ai";

export async function triageEmailWithJev(email: string) {
  const start = performance.now();

  const { answers, usage, providerMetadata } = await evaluate({
    model: typeSafeAi.evaluationModel("jev-latest"),
    state: { email },
    questions: {
      reparto: {
        type: "choice",
        instructions: "Quale reparto deve gestire questa email?",
        criteria: {
          fatturazione: "Addebiti, fatture, rimborsi e metodi di pagamento",
          tecnico: "Bug, errori, disservizi e problemi di integrazione",
          account: "Accesso, password, permessi e modifiche al profilo",
          commerciale: "Prezzi, upgrade, demo e nuovi acquisti",
          spam: "Promozioni non richieste, phishing e contenuti irrilevanti",
        },
      },
      urgenza: {
        type: "score",
        instructions: "Quanto è urgente questa email?",
        criteria: [
          "Nessuna fretta",
          "Da gestire in giornata",
          "Urgente: il cliente è bloccato",
          "Critica: il cliente sta perdendo soldi o dati",
        ],
      },
      rimborso: {
        type: "boolean",
        instructions: "Il cliente chiede indietro dei soldi?",
      },
      phishing: {
        type: "boolean",
        instructions: "È un tentativo di phishing o di truffa?",
      },
      arrabbiato: {
        type: "boolean",
        instructions: "Il cliente è arrabbiato o frustrato?",
      },
      datiSensibili: {
        type: "boolean",
        instructions:
          "L’email contiene dati sensibili come carte, IBAN o password?",
      },
    },
  });

  const confidence = providerMetadata?.typesafe?.confidence as
    Record<string, number> | undefined;
  const repartoConfidence = confidence?.reparto ?? 0;

  const folder =
    answers.phishing.probability > 0.5
      ? "quarantena"
      : repartoConfidence < 0.6
        ? "revisione-umana"
        : answers.reparto.choice;

  return {
    folder,
    reparto: answers.reparto.choice,
    repartoConfidence,
    urgenza: Math.round(answers.urgenza.score),
    urgenzaScore: answers.urgenza.score,
    rimborso: answers.rimborso.probability,
    phishing: answers.phishing.probability,
    arrabbiato: answers.arrabbiato.probability,
    datiSensibili: answers.datiSensibili.probability,
    ms: Math.round(performance.now() - start),
    inputTokens: usage.inputTokens ?? 0,
  };
}
