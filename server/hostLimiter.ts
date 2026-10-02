// Per-host concurrency cap so a large scan (or a shared instance) is polite to every site.

const MAX_PER_HOST = Number(process.env.MINEIRO_HOST_CONCURRENCY || 4);
const active = new Map<string, number>();
const waiting = new Map<string, Array<() => void>>();

export async function withHostSlot<T>(host: string, task: () => Promise<T>): Promise<T> {
  while ((active.get(host) ?? 0) >= MAX_PER_HOST) {
    await new Promise<void>((resolve) => {
      const queue = waiting.get(host) ?? [];
      queue.push(resolve);
      waiting.set(host, queue);
    });
  }
  active.set(host, (active.get(host) ?? 0) + 1);
  try {
    return await task();
  } finally {
    active.set(host, (active.get(host) ?? 1) - 1);
    waiting.get(host)?.shift()?.();
  }
}
