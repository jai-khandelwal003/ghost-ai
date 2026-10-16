"use client";

import { createContext, useContext } from "react";

type StarterTemplatesState = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

// The navbar button (outside the Liveblocks room) opens the modal, which the canvas renders
// inside the room so an import can write to Storage. `EditorShell` owns the state.
const StarterTemplatesContext = createContext<StarterTemplatesState | null>(
  null,
);

export const StarterTemplatesProvider = StarterTemplatesContext.Provider;

// `null` outside `EditorShell`'s workspace view.
export function useStarterTemplates() {
  return useContext(StarterTemplatesContext);
}
