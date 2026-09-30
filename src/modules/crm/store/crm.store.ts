import { immer } from "zustand/middleware/immer";
import { create } from "zustand/react";

interface CRMState {
  isLoading: boolean;
  error: string | null;
  success: boolean;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: boolean) => void;
  reset: () => void;
}

export const useCRMStore = create<CRMState>()(
  immer((set) => ({
    isLoading: false,
    error: null,
    success: false,
    setLoading: (loading: boolean) => set({ isLoading: loading }),
    setError: (error: string | null) => set({ error }),
    setSuccess: (success: boolean) => set({ success }),
    reset: () => set({ isLoading: false, error: null, success: false }),
  })),
);
