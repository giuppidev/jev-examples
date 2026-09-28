import { typeSafeAi } from "@ai-sdk/typesafe-ai";
import { experimental_evaluate as evaluate } from "ai";

export async function rateUrgencyWithJev(email: string) {
  const start = performance.now();

  const { answers, usage, providerMetadata } = await evaluate({
    model: typeSafeAi.evaluationModel("jev-latest"),
    state: { email },
    questions: {
      urgency: {
        type: "score",
        instructions: "Quanto è urgente questa email?",
        criteria: [
          "Nessuna fretta",
          "Da gestire in giornata",
          "Urgente: il cliente è bloccato",
          "Critica: il cliente sta perdendo soldi o dati",
        ],
      },
    },
  });

  const confidence = providerMetadata?.typesafe?.confidence as
    Record<string, number> | undefined;

  return {
    urgency: answers.urgency.score,
    probabilities: answers.urgency.probabilities,
    confidence: confidence?.urgency,
    ms: Math.round(performance.now() - start),
    inputTokens: usage.inputTokens ?? 0,
  };
}
