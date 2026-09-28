import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";

export async function detectRefundWithLLM(
  email: string,
  model: "claude-sonnet-5" | "claude-haiku-4-5",
) {
  const start = performance.now();

  const { output, usage } = await generateText({
    model: anthropic(model),
    system:
      "Sei l'assistente di un helpdesk. Rispondi sì o no: il cliente chiede indietro dei soldi?",
    prompt: email,
    output: Output.choice({ options: ["sì", "no"] }),
    providerOptions: { anthropic: { thinking: { type: "disabled" } } },
  });

  return {
    refund: output === "sì",
    ms: Math.round(performance.now() - start),
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
  };
}
