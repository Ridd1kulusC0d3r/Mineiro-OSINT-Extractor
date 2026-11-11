import { useCallback, useState } from 'react';

export type ModalId = 'shortcuts' | 'modular' | 'bulk' | 'gemini' | 'export' | 'history';

/** Esc closes one modal at a time, in this order (the shortcuts sheet first). */
const CLOSE_ORDER: ModalId[] = ['shortcuts', 'modular', 'bulk', 'gemini', 'export', 'history'];

const ALL_CLOSED: Record<ModalId, boolean> = {
  shortcuts: false, modular: false, bulk: false, gemini: false, export: false, history: false,
};

export function useModals() {
  const [openState, setOpenState] = useState<Record<ModalId, boolean>>(ALL_CLOSED);

  const open = useCallback((id: ModalId) => setOpenState((s) => ({ ...s, [id]: true })), []);
  const close = useCallback((id: ModalId) => setOpenState((s) => ({ ...s, [id]: false })), []);
  const toggle = useCallback((id: ModalId) => setOpenState((s) => ({ ...s, [id]: !s[id] })), []);

  /** Closes the first open modal in CLOSE_ORDER; false when none was open. */
  const closeTopmost = (): boolean => {
    const id = CLOSE_ORDER.find((candidate) => openState[candidate]);
    if (!id) return false;
    close(id);
    return true;
  };

  return { isOpen: openState, open, close, toggle, closeTopmost };
}

export type Modals = ReturnType<typeof useModals>;
