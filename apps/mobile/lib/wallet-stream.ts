import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api-client";

const POLL_INTERVAL_MS = 5_000;
const MAX_BACKOFF_MS = 30_000;

type BalanceEvent = { balanceSar: number };
type TransactionEvent = {
  id: string;
  type: string;
  amountSar: number;
  status: string;
  description: string | null;
  occurredAt: string;
};

function parseSSEChunk(text: string): Array<{ event: string; data: string }> {
  const events: Array<{ event: string; data: string }> = [];
  const frames = text.split("\n\n");
  for (const frame of frames) {
    if (!frame.trim()) continue;
    let event = "message";
    let data = "";
    for (const line of frame.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data = line.slice(5).trim();
    }
    if (data) events.push({ event, data });
  }
  return events;
}

async function connectStream(
  signal: AbortSignal,
  onBalance: (e: BalanceEvent) => void,
  onTransaction: (e: TransactionEvent) => void,
): Promise<void> {
  // reason: React Native's AbortSignal type differs from the DOM lib AbortSignal
  // that fetch's RequestInit expects; the runtime is identical.
  const res = await apiFetch("/api/wallet/stream", {
    signal: signal as unknown as RequestInit["signal"],
    headers: { Accept: "text/event-stream" },
  });

  if (!res.ok || !res.body) throw new Error(`SSE ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Split on double-newline (SSE frame separator), keep the trailing partial frame
    const boundary = buffer.lastIndexOf("\n\n");
    if (boundary === -1) continue;
    const complete = buffer.slice(0, boundary + 2);
    buffer = buffer.slice(boundary + 2);

    for (const { event, data } of parseSSEChunk(complete)) {
      try {
        if (event === "balance") onBalance(JSON.parse(data) as BalanceEvent);
        else if (event === "transaction") onTransaction(JSON.parse(data) as TransactionEvent);
        // connected and ping events are intentionally ignored
      } catch {
        // Malformed JSON — skip
      }
    }
  }
}

export function useWalletStream(enabled = true) {
  const queryClient = useQueryClient();
  const backoffRef = useRef(POLL_INTERVAL_MS);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    async function run() {
      while (!controller.signal.aborted) {
        try {
          await connectStream(
            controller.signal,
            (e) => {
              // Patch balance in-place so the wallet tab updates without a full refetch
              queryClient.setQueryData<{ wallet: { balanceSar: number } }>(
                ["wallet"],
                (old) => old ? { ...old, wallet: { ...old.wallet, balanceSar: e.balanceSar } } : old,
              );
            },
            (_e) => {
              // New transaction arrived — invalidate so the list refetches
              queryClient.invalidateQueries({ queryKey: ["wallet"] });
            },
          );
          backoffRef.current = POLL_INTERVAL_MS;
        } catch (err) {
          if (controller.signal.aborted) break;
          // Exponential backoff: 5 s → 10 s → 20 s → 30 s cap
          await new Promise((r) => setTimeout(r, backoffRef.current));
          backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
        }
      }
    }

    run();

    return () => {
      controller.abort();
    };
  }, [enabled, queryClient]);
}
