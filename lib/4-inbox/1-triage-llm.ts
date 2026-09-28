import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";

export async function triageEmailWithLLM(
  email: string,
  model: "claude-sonnet-5" | "claude-haiku-4-5",
) {
  const start = performance.now();

  const { output, usage } = await generateText({
    model: anthropic(model),
    system: "Sei l'assistente di un helpdesk. Analizza l'email del cliente.",
    prompt: email,
    output: Output.object({
      schema: z.object({
        reparto: z
          .enum(["fatturazione", "tecnico", "account", "commerciale", "spam"])
          .describe("Quale reparto deve gestire questa email?"),
        urgenza: z
          .number()
          .int()
          .min(0)
          .max(3)
          .describe(
            "0: nessuna fretta, 1: da gestire in giornata, 2: urgente, il cliente è bloccato, 3: critica, il cliente sta perdendo soldi o dati",
          ),
        rimborso: z.boolean().describe("Il cliente chiede indietro dei soldi?"),
        phishing: z
          .boolean()
          .describe("È un tentativo di phishing o di truffa?"),
        arrabbiato: z
          .boolean()
          .describe("Il cliente è arrabbiato o frustrato?"),
        datiSensibili: z
          .boolean()
          .describe(
            "L'email contiene dati sensibili come carte, IBAN o password?",
          ),
      }),
    }),
    providerOptions: { anthropic: { thinking: { type: "disabled" } } },
  });

  return {
    folder: output.phishing ? "quarantena" : output.reparto,
    ...output,
    ms: Math.round(performance.now() - start),
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
  };
}
