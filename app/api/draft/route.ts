import { z } from "zod";
import { draftReply } from "@/lib/4-inbox/3-draft-reply";

const body = z.object({
  email: z.string().min(1).max(10_000),
  triage: z.object({
    reparto: z.enum([
      "fatturazione",
      "tecnico",
      "account",
      "commerciale",
      "spam",
    ]),
    urgenza: z.number().int().min(0).max(3),
    rimborso: z.boolean(),
    arrabbiato: z.boolean(),
  }),
});

export async function POST(request: Request) {
  const { email, triage } = body.parse(await request.json());
  return draftReply(email, triage).toTextStreamResponse();
}
