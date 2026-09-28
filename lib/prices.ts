export const PRICES = {
  "claude-sonnet-5": { input: 2, output: 10 },
  "claude-haiku-4-5": { input: 1, output: 5 },
  jev: { input: 0.042, output: 0 },
} as const;

export function costInDollars(
  model: keyof typeof PRICES,
  inputTokens: number,
  outputTokens = 0,
) {
  const price = PRICES[model];
  return (inputTokens * price.input + outputTokens * price.output) / 1_000_000;
}
