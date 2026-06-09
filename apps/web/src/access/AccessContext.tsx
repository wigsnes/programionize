import { useMutation, useQuery } from "convex/react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@programionize/backend/convex/_generated/api";
import {
  clearSessionToken,
  readSessionToken,
  writeSessionToken,
} from "../lib/access-storage";

type AccessContextValue = {
  sessionToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => void;
  redeemToken: (magicToken: string) => Promise<void>;
};

const AccessContext = createContext<AccessContextValue | null>(null);

export function AccessProvider({ children }: { children: ReactNode }) {
  const [sessionToken, setSessionToken] = useState<string | null>(() =>
    readSessionToken(),
  );
  const redeemMagicLink = useMutation(api.access.redeemMagicLink);

  const validation = useQuery(
    api.access.validateSession,
    sessionToken ? { sessionToken } : "skip",
  );

  const isLoading = sessionToken !== null && validation === undefined;
  const isAuthenticated = validation?.valid === true;

  const signOut = useCallback(() => {
    clearSessionToken();
    setSessionToken(null);
  }, []);

  const redeemToken = useCallback(
    async (magicToken: string) => {
      const { sessionToken: next } = await redeemMagicLink({ token: magicToken });
      writeSessionToken(next);
      setSessionToken(next);
    },
    [redeemMagicLink],
  );

  const value = useMemo(
    () => ({
      sessionToken: isAuthenticated ? sessionToken : null,
      isAuthenticated,
      isLoading,
      signOut,
      redeemToken,
    }),
    [sessionToken, isAuthenticated, isLoading, signOut, redeemToken],
  );

  return (
    <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
  );
}

export function useAccess(): AccessContextValue {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error("useAccess must be used within AccessProvider");
  return ctx;
}
