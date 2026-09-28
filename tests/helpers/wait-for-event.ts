import type { EventEmitter } from "node:events";

/** Se resuelve con el primer dato del evento. Rechaza si el emitter emite `error`. */
export function waitForEvent(
  emitter: EventEmitter,
  event: string,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    emitter.once(event, resolve);
    emitter.once("error", reject);
  });
}
