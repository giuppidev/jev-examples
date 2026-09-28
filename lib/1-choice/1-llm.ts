import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";

export async function classifyWithLLM(
  email: string,
  model: "claude-sonnet-5" | "claude-haiku-4-5",
) {
  const start = performance.now();

  const { output, usage } = await generateText({
    model: anthropic(model),
    system: `Sei l'assistente di un helpdesk. Classifica l'email in una di queste categorie:
- fatturazione: addebiti, fatture, rimborsi e metodi di pagamento
- tecnico: bug, errori, disservizi e problemi di integrazione
- account: accesso, password, permessi e modifiche al profilo
- commerciale: prezzi, upgrade, demo e nuovi acquisti
- spam: promozioni non richieste, phishing e contenuti irrilevanti`,
    prompt: email,
    output: Output.choice({
      options: ["fatturazione", "tecnico", "account", "commerciale", "spam"],
    }),
    providerOptions: { anthropic: { thinking: { type: "disabled" } } },
  });

  return {
    category: output,
    ms: Math.round(performance.now() - start),
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
  };
}
