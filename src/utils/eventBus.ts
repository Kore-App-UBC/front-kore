// Simple cross-platform in-memory event bus.
// Avoids relying on `window` or native event emitters so it works on web and React Native.

type Handler = (...args: any[]) => void;

const listeners: Record<string, Set<Handler>> = {};

export const addListener = (event: string, handler: Handler) => {
  if (!listeners[event]) listeners[event] = new Set();
  listeners[event].add(handler);
  return () => removeListener(event, handler);
};

export const removeListener = (event: string, handler: Handler) => {
  const set = listeners[event];
  if (!set) return;
  set.delete(handler);
  if (set.size === 0) delete listeners[event];
};

export const emit = (event: string, ...args: any[]) => {
  const set = listeners[event];
  if (!set) return;
  // call handlers in next tick to avoid reentrancy surprises
  const handlers = Array.from(set);
  handlers.forEach((h) => {
    try {
      h(...args);
    } catch (err) {
      // Don't let one handler break others
      // eslint-disable-next-line no-console
      console.error('eventBus handler error', err);
    }
  });
};

export default { addListener, removeListener, emit };
