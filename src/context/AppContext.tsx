import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { cleanupLocalFiles } from "../services/cleanup";
import { deleteLocalCapture } from "../services/captureStore";
import { loadStoredState, saveStoredState } from "../storage/appStorage";
import { AppSettings, AppState, CaptureRecord, OcrDraft, SavedDoc } from "../types/models";
import { createId } from "../utils/id";

interface AppContextValue {
  isHydrated: boolean;
  state: AppState;
  addDoc: (input: { name: string; docId: string }) => void;
  setActiveDoc: (docId: string) => void;
  setDefaultDoc: (docId: string) => void;
  saveSettings: (settings: Partial<AppSettings>) => void;
  addHistoryRecord: (record: Omit<CaptureRecord, "id">) => string;
  updateHistoryRecord: (id: string, patch: Partial<CaptureRecord>) => void;
  deleteLocalImage: (id: string) => Promise<void>;
  deleteHistoryRecord: (id: string) => Promise<void>;
  deleteAllHistory: () => Promise<void>;
  setDraftOcr: (draft: OcrDraft | null) => void;
  runCleanup: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  backendUrl: "",
  googleDriveAccessToken: "",
  googleDriveTokenExpiresAt: null,
  googleIosClientId: "",
};

const initialState: AppState = {
  docs: [],
  activeDocId: null,
  defaultDocId: null,
  history: [],
  settings: defaultSettings,
  draftOcr: null,
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const stateRef = useRef(state);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      try {
        const stored = await loadStoredState();
        if (!active) {
          return;
        }

        if (stored) {
          const merged: AppState = {
            ...stored,
            settings: {
              ...defaultSettings,
              ...stored.settings,
            },
          };
          setState({
            ...merged,
          });
        }
      } catch {
        if (active) {
          setState(initialState);
        }
      } finally {
        if (active) {
          setIsHydrated(true);
        }
      }
    }

    hydrate();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    saveStoredState(state).catch(() => {
      // Persist best-effort for MVP.
    });
  }, [isHydrated, state]);

  const value = useMemo<AppContextValue>(
    () => ({
      isHydrated,
      state,
      addDoc: ({ name, docId }) => {
        setState((current) => {
          const trimmedDocId = docId.trim();
          const existingDoc = current.docs.find((doc) => doc.docId === trimmedDocId);
          if (existingDoc) {
            const updatedDocs = current.docs.map((doc) =>
              doc.id === existingDoc.id ? { ...doc, name: name.trim() || doc.name } : doc,
            );
            return {
              ...current,
              docs: updatedDocs,
              activeDocId: existingDoc.id,
              defaultDocId: current.defaultDocId ?? existingDoc.id,
            };
          }

          const nextDoc: SavedDoc = {
            id: createId("doc"),
            name: name.trim(),
            docId: trimmedDocId,
            createdAt: new Date().toISOString(),
          };
          const isFirst = current.docs.length === 0;
          return {
            ...current,
            docs: [...current.docs, nextDoc],
            activeDocId: isFirst ? nextDoc.id : current.activeDocId,
            defaultDocId: isFirst ? nextDoc.id : current.defaultDocId,
          };
        });
      },
      setActiveDoc: (docId) => {
        setState((current) => ({ ...current, activeDocId: docId }));
      },
      setDefaultDoc: (docId) => {
        setState((current) => ({
          ...current,
          activeDocId: docId,
          defaultDocId: docId,
        }));
      },
      saveSettings: (settings) => {
        setState((current) => ({
          ...current,
          settings: {
            ...current.settings,
            ...settings,
          },
        }));
      },
      addHistoryRecord: (record) => {
        const id = createId("history");
        setState((current) => ({
          ...current,
          history: [{ ...record, id }, ...current.history],
        }));
        return id;
      },
      updateHistoryRecord: (id, patch) => {
        setState((current) => ({
          ...current,
          history: current.history.map((record) =>
            record.id === id ? { ...record, ...patch } : record,
          ),
        }));
      },
      deleteLocalImage: async (id) => {
        const target = stateRef.current.history.find((record) => record.id === id);
        if (!target?.localUri) {
          return;
        }

        try {
          await deleteLocalCapture(target.localUri);
        } finally {
          setState((current) => ({
            ...current,
            history: current.history.map((record) =>
              record.id === id
                ? {
                    ...record,
                    localDeletedAt: new Date().toISOString(),
                    localUri: null,
                  }
                : record,
            ),
          }));
        }
      },
      deleteHistoryRecord: async (id) => {
        const target = stateRef.current.history.find((record) => record.id === id);
        if (target?.localUri) {
          try {
            await deleteLocalCapture(target.localUri);
          } catch {
            // Best-effort local cleanup before removing history.
          }
        }

        setState((current) => ({
          ...current,
          draftOcr: current.draftOcr?.historyId === id ? null : current.draftOcr,
          history: current.history.filter((record) => record.id !== id),
        }));
      },
      deleteAllHistory: async () => {
        await Promise.all(
          stateRef.current.history.map(async (record) => {
            if (!record.localUri) {
              return;
            }

            try {
              await deleteLocalCapture(record.localUri);
            } catch {
              // Best-effort local cleanup before removing history.
            }
          }),
        );

        setState((current) => ({
          ...current,
          draftOcr: null,
          history: [],
        }));
      },
      setDraftOcr: (draft) => {
        setState((current) => ({ ...current, draftOcr: draft }));
      },
      runCleanup: async () => {
        const cleanedHistory = await cleanupLocalFiles(stateRef.current.history);
        setState((current) => ({
          ...current,
          history: cleanedHistory,
        }));
      },
    }),
    [isHydrated, state],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error("useAppContext must be used within AppProvider");
  }

  return value;
}
