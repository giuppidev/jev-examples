import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";

export async function rateUrgencyWithLLM(
  email: string,
  model: "claude-sonnet-5" | "claude-haiku-4-5",
) {
  const start = performance.now();

  const { output, usage } = await generateText({
    model: anthropic(model),
    system: `Sei l'assistente di un helpdesk. Valuta quanto è urgente l'email su questa scala:
0: Nessuna fretta
1: Da gestire in giornata
2: Urgente: il cliente è bloccato
3: Critica: il cliente sta perdendo soldi o dati`,
    prompt: email,
    output: Output.choice({ options: ["0", "1", "2", "3"] }),
    providerOptions: { anthropic: { thinking: { type: "disabled" } } },
  });

  return {
    urgency: Number(output),
    ms: Math.round(performance.now() - start),
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
  };
}
