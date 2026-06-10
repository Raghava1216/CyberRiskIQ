/**
 * iocStore.ts
 * Shared global IOC store — used by both Threats.tsx and IOC.tsx
 * so that threats added from the live feed appear instantly in the IOC Registry.
 */

import { useSyncExternalStore } from 'react';
import { mockIOCs } from './mockData';
import type { IOC } from './types';

// ── Internal state ────────────────────────────────────────────────────────────

let iocs: IOC[] = [...(mockIOCs as IOC[])];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(l => l());
}

// ── Public API ────────────────────────────────────────────────────────────────

export const iocStore = {
  // Subscribe (used by useSyncExternalStore)
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // Snapshot (used by useSyncExternalStore)
  getSnapshot(): IOC[] {
    return iocs;
  },

  // Add one or more IOCs
  add(items: IOC | IOC[]) {
    const arr = Array.isArray(items) ? items : [items];
    // Deduplicate by value
    const existingValues = new Set(iocs.map(i => i.value));
    const newItems = arr.filter(i => !existingValues.has(i.value));
    if (newItems.length === 0) return 0;
    iocs = [...newItems, ...iocs];
    notify();
    return newItems.length;
  },

  // Remove by id
  remove(id: string) {
    iocs = iocs.filter(i => i.id !== id);
    notify();
  },

  // Replace all (used by IOC page when user deletes etc.)
  set(items: IOC[]) {
    iocs = items;
    notify();
  },
};

// ── React hook ────────────────────────────────────────────────────────────────

export function useIOCStore(): IOC[] {
  return useSyncExternalStore(
    iocStore.subscribe,
    iocStore.getSnapshot,
  );
}
