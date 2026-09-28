import { classifyWithBert } from "@/lib/1-choice/2-bert";
import { rateUrgencyWithBert } from "@/lib/2-score/2-bert";
import { detectRefundWithBert } from "@/lib/3-boolean/2-bert";
import { loadBert } from "@/lib/bert-model";

const handlers = {
  load: async () => {
    await loadBert();
    return null;
  },
  choice: classifyWithBert,
  score: rateUrgencyWithBert,
  boolean: detectRefundWithBert,
};

export type BertTask = keyof typeof handlers;

self.onmessage = async (
  event: MessageEvent<{ id: number; task: BertTask; email: string }>,
) => {
  const { id, task, email } = event.data;
  try {
    self.postMessage({ id, result: await handlers[task](email) });
  } catch (error) {
    self.postMessage({ id, error: String(error) });
  }
};
