import type { BertTask } from "./bert-worker";

type Pending = {
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
};

let worker: Worker | undefined;
let nextId = 0;
const pending = new Map<number, Pending>();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL("./bert-worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = ({ data }) => {
      const request = pending.get(data.id)!;
      pending.delete(data.id);
      if (data.error) request.reject(new Error(data.error));
      else request.resolve(data.result);
    };
  }
  return worker;
}

export function runBert<T>(task: BertTask, email = ""): Promise<T> {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve: resolve as Pending["resolve"], reject });
    getWorker().postMessage({ id, task, email });
  });
}
