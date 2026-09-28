import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

export function draftReply(
  email: string,
  triage: {
    reparto: string;
    urgenza: number;
    rimborso: boolean;
    arrabbiato: boolean;
  },
) {
  return streamText({
    model: anthropic("claude-sonnet-5"),
    system: [
      "Sei un operatore dell’helpdesk. Scrivi una bozza di risposta breve e cordiale, in italiano.",
      `Reparto: ${triage.reparto}. Urgenza: ${triage.urgenza} su 3.`,
      triage.rimborso
        ? "Il cliente chiede un rimborso: conferma che la richiesta è presa in carico."
        : "",
      triage.arrabbiato
        ? "Il cliente è frustrato: scusati per il disagio."
        : "",
    ].join("\n"),
    prompt: email,
    providerOptions: { anthropic: { thinking: { type: "disabled" } } },
  });
}
