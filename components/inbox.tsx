"use client";

import { useState } from "react";
import { costInDollars } from "@/lib/prices";
import { SAMPLE_EMAILS, type SampleEmail } from "@/lib/sample-emails";

const FOLDERS = [
  { id: "tutte", label: "Tutte" },
  { id: "fatturazione", label: "Fatturazione" },
  { id: "tecnico", label: "Tecnico" },
  { id: "account", label: "Account" },
  { id: "commerciale", label: "Commerciale" },
  { id: "spam", label: "Spam" },
  { id: "revisione-umana", label: "Revisione umana" },
  { id: "quarantena", label: "Quarantena" },
];

const URGENCY = ["Nessuna fretta", "In giornata", "Urgente", "Critica"];
const URGENCY_COLOR = [
  "bg-zinc-300",
  "bg-yellow-400",
  "bg-orange-500",
  "bg-red-600",
];

const ENGINES = [
  { id: "jev", name: "Jev" },
  { id: "claude-sonnet-5", name: "Claude Sonnet 5" },
  { id: "claude-haiku-4-5", name: "Claude Haiku 4.5" },
] as const;

type EngineId = (typeof ENGINES)[number]["id"];

type Answer = number | boolean;

type Triage = {
  engine: EngineId;
  folder: string;
  reparto: string;
  repartoConfidence?: number;
  urgenza: number;
  urgenzaScore?: number;
  rimborso: Answer;
  phishing: Answer;
  arrabbiato: Answer;
  datiSensibili: Answer;
  ms: number;
  inputTokens: number;
  outputTokens?: number;
};

const isYes = (answer: Answer) =>
  typeof answer === "boolean" ? answer : answer > 0.5;

const engineName = (engine: EngineId) =>
  ENGINES.find((e) => e.id === engine)!.name;

type Message = SampleEmail & { triage?: Triage; error?: string };

export function Inbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [folder, setFolder] = useState("tutte");
  const [selectedId, setSelectedId] = useState<number>();
  const [receiving, setReceiving] = useState(false);
  const [engine, setEngine] = useState<EngineId>("jev");

  async function triage(message: SampleEmail) {
    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engine,
          email: `${message.subject}\n\n${message.body}`,
        }),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      const result: Triage = { ...(await response.json()), engine };
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, triage: result } : m)),
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id ? { ...m, error: String(error) } : m,
        ),
      );
    }
  }

  async function receiveEmails() {
    setReceiving(true);
    setMessages([]);
    for (const message of SAMPLE_EMAILS) {
      setMessages((prev) => [message, ...prev]);
      triage(message);
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
    setReceiving(false);
  }

  const triaged = messages.filter((m) => m.triage);
  const averageMs = triaged.length
    ? Math.round(
        triaged.reduce((sum, m) => sum + m.triage!.ms, 0) / triaged.length,
      )
    : 0;
  const totalCost = triaged.reduce(
    (sum, m) =>
      sum +
      costInDollars(
        m.triage!.engine,
        m.triage!.inputTokens,
        m.triage!.outputTokens ?? 0,
      ),
    0,
  );

  const visible = messages.filter(
    (m) => folder === "tutte" || m.triage?.folder === folder,
  );
  const selected = messages.find((m) => m.id === selectedId);

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-6 border-b border-zinc-200 px-6 py-3">
        <button
          onClick={receiveEmails}
          disabled={receiving}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {receiving ? "Ricezione in corso…" : "Ricevi email"}
        </button>
        <div className="flex items-center gap-1 text-sm">
          <span className="mr-1 text-zinc-500">Smista con</span>
          {ENGINES.map((e) => (
            <button
              key={e.id}
              onClick={() => setEngine(e.id)}
              disabled={receiving}
              className={`rounded px-3 py-1.5 disabled:opacity-50 ${
                engine === e.id
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              {e.name}
            </button>
          ))}
        </div>
        <span className="font-mono text-sm tabular-nums text-zinc-600">
          {triaged.length} smistate · {averageMs} ms in media · $
          {totalCost.toFixed(6)} totali
        </span>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[12rem_24rem_1fr]">
        <aside className="border-r border-zinc-200 py-3">
          {FOLDERS.map((f) => {
            const count =
              f.id === "tutte"
                ? messages.length
                : messages.filter((m) => m.triage?.folder === f.id).length;
            return (
              <button
                key={f.id}
                onClick={() => setFolder(f.id)}
                className={`flex w-full justify-between px-4 py-1.5 text-left text-sm ${
                  folder === f.id
                    ? "bg-zinc-100 font-semibold"
                    : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <span>{f.label}</span>
                <span className="font-mono tabular-nums text-zinc-400">
                  {count || ""}
                </span>
              </button>
            );
          })}
        </aside>

        <ul className="overflow-y-auto border-r border-zinc-200">
          {visible.map((message) => (
            <li key={message.id}>
              <button
                onClick={() => setSelectedId(message.id)}
                className={`w-full border-b border-zinc-100 px-4 py-3 text-left ${
                  message.id === selectedId ? "bg-zinc-100" : "hover:bg-zinc-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  {message.triage && (
                    <span
                      title={URGENCY[message.triage.urgenza]}
                      className={`h-2 w-2 shrink-0 rounded-full ${URGENCY_COLOR[message.triage.urgenza]}`}
                    />
                  )}
                  <span className="truncate text-sm font-medium">
                    {message.subject}
                  </span>
                </div>
                <p className="truncate text-xs text-zinc-500">{message.from}</p>
                <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
                  {!message.triage && !message.error && (
                    <span className="text-zinc-400">
                      {engineName(engine)} sta decidendo…
                    </span>
                  )}
                  {message.error && (
                    <span className="text-red-600">Errore</span>
                  )}
                  {message.triage && <Flags triage={message.triage} />}
                </div>
              </button>
            </li>
          ))}
        </ul>

        <section className="overflow-y-auto p-6">
          {selected ? (
            <MessageDetail key={selected.id} message={selected} />
          ) : (
            <p className="text-sm text-zinc-400">Seleziona un’email.</p>
          )}
        </section>
      </div>
    </main>
  );
}

function Flags({ triage }: { triage: Triage }) {
  const flags = [
    triage.folder,
    isYes(triage.rimborso) && "rimborso",
    isYes(triage.arrabbiato) && "cliente arrabbiato",
    isYes(triage.datiSensibili) && "dati sensibili",
  ].filter(Boolean);

  return flags.map((flag) => (
    <span
      key={String(flag)}
      className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-700"
    >
      {flag}
    </span>
  ));
}

function MessageDetail({ message }: { message: Message }) {
  const [draft, setDraft] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [draftMs, setDraftMs] = useState<number>();

  async function writeDraft() {
    if (!message.triage) return;
    setDraft("");
    setDrafting(true);
    const start = performance.now();

    const response = await fetch("/api/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `${message.subject}\n\n${message.body}`,
        triage: {
          reparto: message.triage.reparto,
          urgenza: message.triage.urgenza,
          rimborso: isYes(message.triage.rimborso),
          arrabbiato: isYes(message.triage.arrabbiato),
        },
      }),
    });
    if (!response.ok) {
      setDraft(`Errore: ${await response.text()}`);
      setDrafting(false);
      return;
    }
    const reader = response
      .body!.pipeThrough(new TextDecoderStream())
      .getReader();
    for (
      let chunk = await reader.read();
      !chunk.done;
      chunk = await reader.read()
    ) {
      setDraft((prev) => prev + chunk.value);
    }

    setDraftMs(Math.round(performance.now() - start));
    setDrafting(false);
  }

  const t = message.triage;

  return (
    <article className="max-w-2xl space-y-6">
      <header>
        <h2 className="text-xl font-semibold">{message.subject}</h2>
        <p className="text-sm text-zinc-500">{message.from}</p>
      </header>
      <p className="leading-relaxed">{message.body}</p>
      {message.error && (
        <p className="break-words text-sm text-red-600">{message.error}</p>
      )}

      {t && (
        <div className="space-y-3 rounded-lg border border-zinc-200 p-4">
          <h3 className="text-sm font-semibold">
            Decisioni di {engineName(t.engine)}{" "}
            <span className="font-mono font-normal text-zinc-500">
              · {t.ms} ms · 1 chiamata
            </span>
          </h3>
          <dl className="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-zinc-500">Reparto</dt>
            <dd>
              {t.reparto}{" "}
              <span className="text-zinc-400">
                {t.repartoConfidence === undefined
                  ? "(nessuna confidence)"
                  : `(confidence ${Math.round(t.repartoConfidence * 100)}%)`}
              </span>
            </dd>
            <dt className="text-zinc-500">Urgenza</dt>
            <dd>
              {URGENCY[t.urgenza]} ({t.urgenza}/3){" "}
              {t.urgenzaScore !== undefined && (
                <span className="font-mono text-zinc-400">
                  · score {t.urgenzaScore.toFixed(2)}
                </span>
              )}
            </dd>
            <Probability label="Chiede un rimborso" value={t.rimborso} />
            <Probability label="Phishing" value={t.phishing} />
            <Probability label="Cliente arrabbiato" value={t.arrabbiato} />
            <Probability label="Dati sensibili" value={t.datiSensibili} />
            <dt className="text-zinc-500">Cartella</dt>
            <dd className="font-medium">{t.folder}</dd>
          </dl>
        </div>
      )}

      {t && t.folder !== "quarantena" && (
        <div className="space-y-3">
          <button
            onClick={writeDraft}
            disabled={drafting}
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-50"
          >
            Scrivi una bozza con Claude Sonnet 5
          </button>
          {(draft || drafting) && (
            <div className="space-y-2">
              <p className="whitespace-pre-wrap rounded-lg bg-zinc-50 p-4 text-sm leading-relaxed">
                {draft || "…"}
              </p>
              {draftMs !== undefined && (
                <p className="font-mono text-xs text-zinc-500">
                  Bozza scritta in {draftMs} ms
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function Probability({ label, value }: { label: string; value: Answer }) {
  if (typeof value === "boolean") {
    return (
      <>
        <dt className="text-zinc-500">{label}</dt>
        <dd>{value ? "sì" : "no"}</dd>
      </>
    );
  }

  return (
    <>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="flex items-center gap-2">
        <span className="h-2 w-32 rounded-full bg-zinc-100">
          <span
            className="block h-2 rounded-full bg-zinc-900"
            style={{ width: `${value * 100}%` }}
          />
        </span>
        <span className="font-mono text-xs tabular-nums text-zinc-500">
          {Math.round(value * 100)}%
        </span>
      </dd>
    </>
  );
}
