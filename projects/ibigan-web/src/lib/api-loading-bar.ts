let pendingCount = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function trackApiRequestStart() {
  pendingCount += 1;
  emit();
}

export function trackApiRequestEnd() {
  pendingCount = Math.max(0, pendingCount - 1);
  emit();
}

export function getApiPendingCount() {
  return pendingCount;
}

export function subscribeApiLoading(listener: () => void) {
  listeners.add(listener);
  listener();

  return () => {
    listeners.delete(listener);
  };
}
