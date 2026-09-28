import { typeSafeAi } from "@ai-sdk/typesafe-ai";
import { experimental_evaluate as evaluate } from "ai";

export async function detectRefundWithJev(email: string) {
  const start = performance.now();

  const { answers, usage } = await evaluate({
    model: typeSafeAi.evaluationModel("jev-latest"),
    state: { email },
    questions: {
      refund: {
        type: "boolean",
        instructions: "Il cliente chiede indietro dei soldi?",
      },
    },
  });

  return {
    refund: answers.refund.probability,
    ms: Math.round(performance.now() - start),
    inputTokens: usage.inputTokens ?? 0,
  };
}
