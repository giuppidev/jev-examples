import type { ZeroShotClassificationOutput } from "@huggingface/transformers";
import { loadBert } from "../bert-model";

export async function rateUrgencyWithBert(email: string) {
  const classify = await loadBert();
  const start = performance.now();

  const levels = [
    "nessuna fretta",
    "da gestire in giornata",
    "urgente, il cliente è bloccato",
    "critica, il cliente sta perdendo soldi o dati",
  ];

  const { labels, scores } = (await classify(email, levels, {
    hypothesis_template: "L'urgenza di questa email è: {}.",
  })) as ZeroShotClassificationOutput;

  const probabilities = levels.map((level) => scores[labels.indexOf(level)]);
  const urgency = probabilities.reduce((sum, p, level) => sum + p * level, 0);

  return {
    urgency,
    probabilities: Object.fromEntries(
      probabilities.map((p, level) => [level, p]),
    ),
    ms: Math.round(performance.now() - start),
  };
}
