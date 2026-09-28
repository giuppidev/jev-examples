"use client";

import { useRef, useState } from "react";
import { costInDollars } from "@/lib/prices";
import { SAMPLE_EMAILS } from "@/lib/sample-emails";
import { runBert } from "./bert-client";

const ENGINES = [
  { id: "claude-sonnet-5", name: "Claude Sonnet 5", kind: "LLM" },
  { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", kind: "LLM" },
  { id: "bert", name: "BERT", kind: "Encoder · nel browser" },
  { id: "jev", name: "Jev", kind: "System One" },
] as const;

type EngineId = (typeof ENGINES)[number]["id"];

type CheckType = "choice" | "score" | "boolean";

const URGENCY = [
  "0 · nessuna fretta",
  "1 · in giornata",
  "2 · urgente",
  "3 · critica",
];

const CHECKS: { type: CheckType; question: string; options: string[] }[] = [
  {
    type: "choice",
    question: "Quale reparto?",
    options: ["fatturazione", "tecnico", "account", "commerciale", "spam"],
  },
  { type: "score", question: "Quanto è urgente?", options: URGENCY },
  { type: "boolean", question: "Chiede un rimborso?", options: ["sì", "no"] },
];

type Raw = {
  ms: number;
  inputTokens?: number;
  outputTokens?: number;
  category?: string;
  urgency?: number;
  refund?: boolean | number;
  probabilities?: Record<string, number>;
  confidence?: number;
};

type Result = {
  ms: number;
  cost: number;
  chosen: string;
  score?: number;
  probabilities?: Record<string, number>;
  confidence?: number;
};

type CheckState = {
  status: "running" | "done" | "error";
  result?: Result;
  error?: string;
};

type Results<T> = Partial<Record<CheckType, T>>;

async function runEngine(
  engine: EngineId,
  checks: CheckType[],
  email: string,
): Promise<Results<Raw>> {
  if (engine === "bert") {
    const results = await Promise.all(
      checks.map((check) => runBert<Raw>(check, email)),
    );
    return Object.fromEntries(checks.map((check, i) => [check, results[i]]));
  }

  const response = await fetch("/api/classify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ engine, checks, email }),
  });
  if (!response.ok) throw new Error((await response.json()).error);
  return response.json();
}

function toResult(type: CheckType, engine: EngineId, raw: Raw): Result {
  const cost =
    engine === "bert"
      ? 0
      : costInDollars(engine, raw.inputTokens ?? 0, raw.outputTokens ?? 0);
  const base = { ms: raw.ms, cost, confidence: raw.confidence };

  if (type === "choice") {
    return { ...base, chosen: raw.category!, probabilities: raw.probabilities };
  }

  if (type === "score") {
    const probabilities =
      raw.probabilities &&
      Object.fromEntries(
        Object.entries(raw.probabilities).map(([level, p]) => [
          URGENCY[Number(level)],
          p,
        ]),
      );
    const mostLikely =
      probabilities &&
      Object.entries(probabilities).sort(([, a], [, b]) => b - a)[0][0];
    return {
      ...base,
      chosen: mostLikely ?? URGENCY[raw.urgency!],
      score: raw.urgency,
      probabilities,
    };
  }

  if (typeof raw.refund === "boolean") {
    return { ...base, chosen: raw.refund ? "sì" : "no" };
  }

  return {
    ...base,
    chosen: raw.refund! > 0.5 ? "sì" : "no",
    probabilities: { sì: raw.refund!, no: 1 - raw.refund! },
  };
}

const formatCost = (dollars: number) => `$${dollars.toFixed(6)}`;

function details(result?: Result) {
  if (!result) return "";
  return [
    result.score !== undefined &&
      result.probabilities &&
      `media pesata ${result.score.toFixed(2)}`,
    result.confidence !== undefined &&
      `confidence ${Math.round(result.confidence * 100)}%`,
  ]
    .filter(Boolean)
    .join(" · ");
}

function OptionCell({ option, result }: { option: string; result?: Result }) {
  if (!result) return null;
  const isChosen = option === result.chosen;
  const probability = result.probabilities?.[option];

  if (probability === undefined) {
    return isChosen ? (
      <span className="rounded bg-zinc-900 px-2 py-0.5 text-xs font-medium text-white">
        ✓ {option}
      </span>
    ) : null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="h-1.5 flex-1 rounded-full bg-zinc-100">
        <span
          className={`block h-1.5 rounded-full ${isChosen ? "bg-zinc-900" : "bg-zinc-300"}`}
          style={{ width: `${Math.round(probability * 100)}%` }}
        />
      </span>
      <span
        className={`w-9 text-right font-mono text-xs tabular-nums ${isChosen ? "font-semibold text-zinc-900" : "text-zinc-500"}`}
      >
        {Math.round(probability * 100)}%
      </span>
    </div>
  );
}

const median = (values: number[]) =>
  values.length
    ? [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) / 2)]
    : 0;

type Run = (
  engine: EngineId,
  checks: CheckType[],
  email: string,
) => Promise<Results<Result>>;

export function Playground() {
  const [email, setEmail] = useState(SAMPLE_EMAILS[0].body);
  const [checks, setChecks] = useState<Record<string, CheckState>>({});
  const [bert, setBert] = useState<{
    status: "idle" | "loading" | "ready";
    ms?: number;
  }>({
    status: "idle",
  });
  const bertLoading = useRef<Promise<void>>(undefined);

  function loadBertModel() {
    bertLoading.current ??= (async () => {
      setBert({ status: "loading" });
      const start = performance.now();
      await runBert("load");
      setBert({ status: "ready", ms: Math.round(performance.now() - start) });
    })();
    return bertLoading.current;
  }

  const run: Run = async (engine, checks, text) => {
    if (engine === "bert") await loadBertModel();
    const raw = await runEngine(engine, checks, text);
    return Object.fromEntries(
      checks.map((check) => [check, toResult(check, engine, raw[check]!)]),
    );
  };

  function setEngineChecks(
    engine: EngineId,
    state: (check: CheckType) => CheckState,
  ) {
    setChecks((prev) => ({
      ...prev,
      ...Object.fromEntries(
        CHECKS.map(({ type }) => [`${engine}:${type}`, state(type)]),
      ),
    }));
  }

  async function runEngineChecks(engine: EngineId) {
    setEngineChecks(engine, () => ({ status: "running" }));
    try {
      const results = await run(
        engine,
        CHECKS.map(({ type }) => type),
        email,
      );
      setEngineChecks(engine, (check) => ({
        status: "done",
        result: results[check],
      }));
    } catch (error) {
      setEngineChecks(engine, () => ({
        status: "error",
        error: String(error),
      }));
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <label htmlFor="sample" className="text-sm text-zinc-500">
            Email di esempio
          </label>
          <select
            id="sample"
            className="rounded border border-zinc-300 px-2 py-1 text-sm"
            onChange={(event) =>
              setEmail(SAMPLE_EMAILS[Number(event.target.value)].body)
            }
          >
            {SAMPLE_EMAILS.map((sample, index) => (
              <option key={sample.id} value={index}>
                {sample.subject}
              </option>
            ))}
          </select>
          <span className="ml-auto text-xs text-zinc-500">
            BERT:{" "}
            {bert.status === "idle" && (
              <button
                onClick={loadBertModel}
                className="underline hover:text-zinc-900"
              >
                scarica il modello (107 MB)
              </button>
            )}
            {bert.status === "loading" && "scarico e preparo il modello…"}
            {bert.status === "ready" && `modello pronto in ${bert.ms} ms`}
          </span>
        </div>
        <textarea
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          rows={3}
          className="w-full rounded border border-zinc-300 p-3 text-base"
        />
        <button
          onClick={() =>
            ENGINES.forEach((engine) => runEngineChecks(engine.id))
          }
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Esegui tutto
        </button>
      </section>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-48" />
            {ENGINES.map((engine) => (
              <col key={engine.id} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-zinc-300">
              <th />
              {ENGINES.map((engine) => (
                <th key={engine.id} className="px-3 pb-3 text-left font-normal">
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <div className="font-semibold">{engine.name}</div>
                      <div className="text-xs text-zinc-500">{engine.kind}</div>
                    </div>
                    <button
                      onClick={() => runEngineChecks(engine.id)}
                      className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50"
                    >
                      Esegui
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          {CHECKS.map((check) => (
            <tbody key={check.type} className="border-b border-zinc-200">
              <tr>
                <th className="pt-4 pb-2 text-left align-top font-normal">
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px]">
                    {check.type}
                  </span>
                  <div className="mt-1 font-medium">{check.question}</div>
                </th>
                {ENGINES.map((engine) => {
                  const state = checks[`${engine.id}:${check.type}`];
                  return (
                    <td key={engine.id} className="px-3 pt-4 pb-2 align-top">
                      {state?.status === "error" ? (
                        <p className="line-clamp-2 break-words text-xs text-red-600">
                          {state.error}
                        </p>
                      ) : (
                        <span className="font-mono text-2xl tabular-nums">
                          {state?.status === "running"
                            ? "…"
                            : state?.result
                              ? `${state.result.ms} ms`
                              : ""}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
              {check.options.map((option) => (
                <tr key={option} className="h-7 border-t border-zinc-100">
                  <th className="text-left text-xs font-normal text-zinc-500">
                    {option}
                  </th>
                  {ENGINES.map((engine) => (
                    <td key={engine.id} className="px-3">
                      <OptionCell
                        option={option}
                        result={checks[`${engine.id}:${check.type}`]?.result}
                      />
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="h-8">
                <th />
                {ENGINES.map((engine) => (
                  <td
                    key={engine.id}
                    className="px-3 pb-2 font-mono text-[11px] text-zinc-500"
                  >
                    {details(checks[`${engine.id}:${check.type}`]?.result)}
                  </td>
                ))}
              </tr>
            </tbody>
          ))}
          <tfoot>
            <tr>
              <th className="pt-3 text-left text-xs font-normal text-zinc-500">
                Costo totale
              </th>
              {ENGINES.map((engine) => {
                const results = CHECKS.map(
                  (check) => checks[`${engine.id}:${check.type}`]?.result,
                );
                const totalCost = results.reduce(
                  (sum, result) => sum + (result?.cost ?? 0),
                  0,
                );
                return (
                  <td
                    key={engine.id}
                    className="px-3 pt-3 font-mono text-xs text-zinc-600"
                  >
                    {engine.id === "bert"
                      ? "gratis, gira nel browser"
                      : results.some(Boolean)
                        ? formatCost(totalCost)
                        : ""}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      <Race run={run} />
    </main>
  );
}

type RaceStats = {
  done: number;
  correct: number;
  times: number[];
  cost: number;
  error?: string;
};

function Race({ run }: { run: Run }) {
  const [race, setRace] = useState<Partial<Record<EngineId, RaceStats>>>({});
  const [racing, setRacing] = useState(false);

  async function runRaceLane(engine: EngineId) {
    const stats: RaceStats = { done: 0, correct: 0, times: [], cost: 0 };
    setRace((prev) => ({ ...prev, [engine]: { ...stats } }));
    try {
      for (const sample of SAMPLE_EMAILS) {
        const result = (await run(engine, ["choice"], sample.body)).choice!;
        stats.done++;
        stats.times.push(result.ms);
        stats.cost += result.cost;
        if (result.chosen === sample.expected) stats.correct++;
        setRace((prev) => ({
          ...prev,
          [engine]: { ...stats, times: [...stats.times] },
        }));
      }
    } catch (error) {
      setRace((prev) => ({
        ...prev,
        [engine]: { ...stats, error: String(error) },
      }));
    }
  }

  async function startRace() {
    setRacing(true);
    await Promise.all(ENGINES.map((engine) => runRaceLane(engine.id)));
    setRacing(false);
  }

  return (
    <section className="space-y-4 border-t border-zinc-200 pt-8">
      <header className="flex items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            Gara: choice su {SAMPLE_EMAILS.length} email, una dopo l’altra
          </h2>
          <p className="text-sm text-zinc-500">
            Email classificate · risposte giuste · tempo mediano per email ·
            costo totale. I tempi di LLM e Jev sono misurati sul server, quelli
            di BERT nel browser.
          </p>
        </div>
        <button
          onClick={startRace}
          disabled={racing}
          className="ml-auto rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {racing ? "In corso…" : "Avvia la gara"}
        </button>
      </header>

      <div className="space-y-3">
        {ENGINES.map((engine) => {
          const stats = race[engine.id];
          const progress = stats ? stats.done / SAMPLE_EMAILS.length : 0;
          return (
            <div
              key={engine.id}
              className="grid grid-cols-[10rem_1fr_24rem] items-center gap-4"
            >
              <span className="text-sm font-medium">{engine.name}</span>
              <span className="h-4 rounded-full bg-zinc-100">
                <span
                  className="block h-4 rounded-full bg-zinc-900 transition-all"
                  style={{ width: `${progress * 100}%` }}
                />
              </span>
              {stats?.error ? (
                <span className="truncate text-xs text-red-600">
                  {stats.error}
                </span>
              ) : (
                <span className="grid grid-cols-4 gap-2 font-mono text-xs tabular-nums text-zinc-600">
                  <span>
                    {stats ? `${stats.done}/${SAMPLE_EMAILS.length}` : "—"}
                  </span>
                  <span>{stats ? `✓ ${stats.correct}` : ""}</span>
                  <span>
                    {stats?.times.length ? `${median(stats.times)} ms` : ""}
                  </span>
                  <span>{stats ? formatCost(stats.cost) : ""}</span>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
