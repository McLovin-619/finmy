export type SSEMessage = {
  event?: string;
  data: string;
  id?: string;
};

export function toSSEString(msg: SSEMessage): string {
  const lines: string[] = [];
  if (msg.id !== undefined) {
    lines.push(`id: ${msg.id}`);
  }
  if (msg.event !== undefined) {
    lines.push(`event: ${msg.event}`);
  }
  lines.push(`data: ${msg.data}`);
  lines.push("");
  lines.push("");
  return lines.join("\n");
}

export const sseHeaders: Record<string, string> = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
};

export function createSSEReadableStream(
  generator: () => AsyncGenerator<SSEMessage>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const msg of generator()) {
          controller.enqueue(encoder.encode(toSSEString(msg)));
        }
      } catch {
        // Generator threw — close the stream without re-throwing so the
        // HTTP response terminates cleanly from the client's perspective.
      } finally {
        controller.close();
      }
    },
  });
}
