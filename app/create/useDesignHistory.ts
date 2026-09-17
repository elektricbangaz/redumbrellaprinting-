"use client";

import { useCallback, useMemo, useState } from "react";
import type { DesignSides } from "@/lib/designer-types";

type History = {
  past: DesignSides[];
  present: DesignSides;
  future: DesignSides[];
};

const LIMIT = 40;

export function useDesignHistory(initial: DesignSides) {
  const [history, setHistory] = useState<History>({
    past: [],
    present: initial,
    future: [],
  });

  const setDesign = useCallback((next: React.SetStateAction<DesignSides>) => {
    setHistory((current) => {
      const value = typeof next === "function"
        ? (next as (prev: DesignSides) => DesignSides)(current.present)
        : next;
      if (value === current.present) return current;
      return {
        past: [...current.past, current.present].slice(-LIMIT),
        present: value,
        future: [],
      };
    });
  }, []);

  const replaceDesign = useCallback((next: DesignSides) => {
    setHistory({ past: [], present: next, future: [] });
  }, []);

  const undo = useCallback(() => {
    setHistory((current) => {
      if (!current.past.length) return current;
      const previous = current.past[current.past.length - 1];
      return {
        past: current.past.slice(0, -1),
        present: previous,
        future: [current.present, ...current.future].slice(0, LIMIT),
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((current) => {
      if (!current.future.length) return current;
      const next = current.future[0];
      return {
        past: [...current.past, current.present].slice(-LIMIT),
        present: next,
        future: current.future.slice(1),
      };
    });
  }, []);

  return useMemo(() => ({
    design: history.present,
    setDesign,
    replaceDesign,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  }), [history, setDesign, replaceDesign, undo, redo]);
}
