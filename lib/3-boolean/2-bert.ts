import type { ZeroShotClassificationOutput } from "@huggingface/transformers";
import { loadBert } from "../bert-model";

export async function detectRefundWithBert(email: string) {
  const classify = await loadBert();
  const start = performance.now();

  const { scores } = (await classify(
    email,
    ["il cliente chiede indietro dei soldi"],
    { hypothesis_template: "In questa email {}.", multi_label: true },
  )) as ZeroShotClassificationOutput;

  return {
    refund: scores[0],
    ms: Math.round(performance.now() - start),
  };
}
