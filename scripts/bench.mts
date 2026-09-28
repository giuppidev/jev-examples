import { classifyWithLLM } from "../lib/1-choice/1-llm";
import { classifyWithJev } from "../lib/1-choice/3-jev";
import { costInDollars } from "../lib/prices";
import { SAMPLE_EMAILS } from "../lib/sample-emails";

const ENGINES = {
  "claude-sonnet-5": (email: string) =>
    classifyWithLLM(email, "claude-sonnet-5"),
  "claude-haiku-4-5": (email: string) =>
    classifyWithLLM(email, "claude-haiku-4-5"),
  jev: (email: string) => classifyWithJev(email),
};

const percentile = (values: number[], p: number) =>
  [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) * p)];

const rows = [];

for (const [name, classify] of Object.entries(ENGINES)) {
  await classify(SAMPLE_EMAILS[0].body);

  const times: number[] = [];
  let correct = 0;
  let cost = 0;

  for (const email of SAMPLE_EMAILS) {
    const result = await classify(email.body);
    times.push(result.ms);
    if (result.category === email.expected) correct++;
    cost += costInDollars(
      name as keyof typeof ENGINES,
      result.inputTokens,
      "outputTokens" in result ? result.outputTokens : 0,
    );
    process.stdout.write(".");
  }

  rows.push({
    modello: name,
    accuratezza: `${correct}/${SAMPLE_EMAILS.length}`,
    "mediana ms": percentile(times, 0.5),
    "p95 ms": percentile(times, 0.95),
    "costo totale $": cost.toFixed(6),
  });
  console.log(` ${name}`);
}

console.table(rows);
