import { useState, useCallback, useRef } from 'react';
import { SettingDefinition } from '../../types/environment';
import { saveCustomSetting } from '../../data/settings/customStore';

interface HistoryState {
  past: SettingDefinition[];
  present: SettingDefinition;
  future: SettingDefinition[];
}

export function useSoundstageHistory(initialSetting: SettingDefinition) {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initialSetting,
    future: [],
  });

  const presentRef = useRef(history.present);
  presentRef.current = history.present;

  const setPresent = useCallback((newSetting: SettingDefinition | ((prev: SettingDefinition) => SettingDefinition), recordHistory = true) => {
    setHistory((curr) => {
      const resolved = typeof newSetting === 'function' ? newSetting(curr.present) : newSetting;
      if (resolved === curr.present) return curr;

      // Auto-save to localStorage
      saveCustomSetting(resolved);

      if (!recordHistory) {
        return {
          ...curr,
          present: resolved,
        };
      }

      // Limit history to 50 entries
      const nextPast = [...curr.past, curr.present].slice(-50);
      return {
        past: nextPast,
        present: resolved,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((curr) => {
      if (curr.past.length === 0) return curr;
      const previous = curr.past[curr.past.length - 1];
      const newPast = curr.past.slice(0, curr.past.length - 1);
      saveCustomSetting(previous);
      return {
        past: newPast,
        present: previous,
        future: [curr.present, ...curr.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((curr) => {
      if (curr.future.length === 0) return curr;
      const next = curr.future[0];
      const newFuture = curr.future.slice(1);
      saveCustomSetting(next);
      return {
        past: [...curr.past, curr.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const resetSetting = useCallback((setting: SettingDefinition) => {
    setHistory({
      past: [],
      present: setting,
      future: [],
    });
    saveCustomSetting(setting);
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return {
    setting: history.present,
    setSetting: setPresent,
    undo,
    redo,
    canUndo,
    canRedo,
    resetSetting,
  };
}
