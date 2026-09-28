import type { ZeroShotClassificationOutput } from "@huggingface/transformers";
import { loadBert } from "../bert-model";

export async function classifyWithBert(email: string) {
  const classify = await loadBert();
  const start = performance.now();

  const categories: Record<string, string> = {
    "addebiti, fatture, rimborsi e metodi di pagamento": "fatturazione",
    "bug, errori, disservizi e problemi di integrazione": "tecnico",
    "accesso, password, permessi e modifiche al profilo": "account",
    "prezzi, upgrade, demo e nuovi acquisti": "commerciale",
    "promozioni non richieste, phishing e contenuti irrilevanti": "spam",
  };

  const { labels, scores } = (await classify(email, Object.keys(categories), {
    hypothesis_template: "Questa email riguarda: {}.",
  })) as ZeroShotClassificationOutput;

  return {
    category: categories[labels[0]],
    probabilities: Object.fromEntries(
      labels.map((label, i) => [categories[label], scores[i]]),
    ),
    ms: Math.round(performance.now() - start),
  };
}
