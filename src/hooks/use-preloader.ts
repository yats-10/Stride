// Tiny shared flag: has the first-load preloader finished? The Preloader flips it true
// on completion; the hero title and the hero's 3D burst wait for it so their intros play
// only after the preloader has revealed the page (not hidden behind it). Read the value
// reactively via the hook, or once per frame via `usePreloader.getState().done`.
import { create } from "zustand";

interface PreloaderState {
  done: boolean;
  setDone: () => void;
}

export const usePreloader = create<PreloaderState>((set) => ({
  done: false,
  setDone: () => set({ done: true }),
}));
