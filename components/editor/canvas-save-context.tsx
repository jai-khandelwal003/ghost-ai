"use client";

import { createContext, useContext } from "react";

import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave";

export type CanvasSaveControl = {
  status: CanvasSaveStatus;
  // Shown as the button's tooltip in the error state.
  error?: string;
  // Missing while the saved canvas is still loading.
  onSave?: () => void;
};

type CanvasSaveReporter = (control: CanvasSaveControl | null) => void;

// The canvas (inside the Liveblocks room) reports its save state up to the navbar's Save
// button (outside it). `EditorShell` owns the state.
const CanvasSaveContext = createContext<CanvasSaveReporter | null>(null);

export const CanvasSaveProvider = CanvasSaveContext.Provider;

// `null` outside `EditorShell`'s workspace view.
export function useCanvasSaveReporter() {
  return useContext(CanvasSaveContext);
}
