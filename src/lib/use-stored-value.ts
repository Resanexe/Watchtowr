'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

const EVENT_NAME = 'watchtowr:storage-change';

export function notifyStoredValueChanged(key: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: key }));
  }
}

export function useStoredValue<T>(key: string, fallback: T): T {
  const subscribeToKey = useCallback((callback: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) callback();
    };
    const onLocalChange = (event: Event) => {
      if ((event as CustomEvent<string>).detail === key) callback();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(EVENT_NAME, onLocalChange);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(EVENT_NAME, onLocalChange);
    };
  }, [key]);
  const getClientSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }, [key]);
  const raw = useSyncExternalStore(
    subscribeToKey,
    getClientSnapshot,
    () => null
  );

  return useMemo(() => {
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }, [fallback, raw]);
}
