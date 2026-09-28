import { z } from "zod";
import { classifyWithLLM } from "@/lib/1-choice/1-llm";
import { classifyWithJev } from "@/lib/1-choice/3-jev";
import { rateUrgencyWithLLM } from "@/lib/2-score/1-llm";
import { rateUrgencyWithJev } from "@/lib/2-score/3-jev";
import { detectRefundWithLLM } from "@/lib/3-boolean/1-llm";
import { detectRefundWithJev } from "@/lib/3-boolean/3-jev";

const body = z.object({
  engine: z.enum(["claude-sonnet-5", "claude-haiku-4-5", "jev"]),
  checks: z.array(z.enum(["choice", "score", "boolean"])).min(1),
  email: z.string().min(1).max(10_000),
});

const handlers = {
  choice: { llm: classifyWithLLM, jev: classifyWithJev },
  score: { llm: rateUrgencyWithLLM, jev: rateUrgencyWithJev },
  boolean: { llm: detectRefundWithLLM, jev: detectRefundWithJev },
};

export async function POST(request: Request) {
  try {
    const { engine, checks, email } = body.parse(await request.json());

    const results = await Promise.all(
      checks.map((check) =>
        engine === "jev"
          ? handlers[check].jev(email)
          : handlers[check].llm(email, engine),
      ),
    );

    return Response.json(
      Object.fromEntries(checks.map((check, i) => [check, results[i]])),
    );
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
