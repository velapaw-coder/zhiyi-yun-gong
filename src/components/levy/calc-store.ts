"use client";

import { useSyncExternalStore } from "react";
import type { LevyDraft } from "@/components/levy/fields";

/** 计算器 → 留资表单共享当前测算参数（同一页面内）。touched=用户动过参数或点了预约。 */
type State = { draft: LevyDraft | null; touched: boolean };
let state: State = { draft: null, touched: false };
const listeners = new Set<() => void>();

export function setCalcDraft(draft: LevyDraft, touched?: boolean) {
  state = { draft, touched: touched ?? state.touched };
  listeners.forEach((l) => l());
}

export function markCalcTouched() {
  if (!state.draft || state.touched) return;
  state = { ...state, touched: true };
  listeners.forEach((l) => l());
}

const server: State = { draft: null, touched: false };
export function useCalcDraft() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => server,
  );
}
