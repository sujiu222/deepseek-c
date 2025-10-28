import { create } from "zustand";
import type { User } from "@prisma/client";

export type StoreState = {
  user: User | null;
  setUser: (user: User | null) => void;
};

const useStore = create<StoreState>((set, get) => ({
  user: null as User | null,
  setUser: (user: User | null) => set({ user }),
}));

export default useStore;
