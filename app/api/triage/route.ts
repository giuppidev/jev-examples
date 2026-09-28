import { z } from "zod";
import { triageEmailWithLLM } from "@/lib/4-inbox/1-triage-llm";
import { triageEmailWithJev } from "@/lib/4-inbox/2-triage-jev";

const body = z.object({
  engine: z.enum(["jev", "claude-sonnet-5", "claude-haiku-4-5"]),
  email: z.string().min(1).max(10_000),
});

export async function POST(request: Request) {
  try {
    const { engine, email } = body.parse(await request.json());
    return Response.json(
      engine === "jev"
        ? await triageEmailWithJev(email)
        : await triageEmailWithLLM(email, engine),
    );
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
