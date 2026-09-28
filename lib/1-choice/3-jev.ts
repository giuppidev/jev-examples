import { typeSafeAi } from "@ai-sdk/typesafe-ai";
import { experimental_evaluate as evaluate } from "ai";

export async function classifyWithJev(email: string) {
  const start = performance.now();

  const { answers, usage, providerMetadata } = await evaluate({
    model: typeSafeAi.evaluationModel("jev-latest"),
    state: { email },
    questions: {
      category: {
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
    },
  });

  const confidence = providerMetadata?.typesafe?.confidence as
    Record<string, number> | undefined;

  return {
    category: answers.category.choice,
    probabilities: answers.category.probabilities,
    confidence: confidence?.category,
    ms: Math.round(performance.now() - start),
    inputTokens: usage.inputTokens ?? 0,
  };
}
