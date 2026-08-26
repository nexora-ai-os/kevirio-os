import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const OWNER_SAVE_STATE = Object.freeze({ SAVED: "SAVED", UNSAVED: "UNSAVED", SAVING: "SAVING", SAVE_FAILED: "SAVE_FAILED", CONFLICT: "CONFLICT" });
const LABELS = Object.freeze({ SAVED: "保存済み", UNSAVED: "未保存", SAVING: "保存中…", SAVE_FAILED: "保存失敗", CONFLICT: "競合を検出" });
const OwnerEditGuardContext = createContext(null);

export function OwnerEditGuardProvider({ children }) {
  const [editors, setEditors] = useState({});
  const report = useCallback((id, state, detail = "") => setEditors((current) => ({ ...current, [id]: { state, detail } })), []);
  const release = useCallback((id) => setEditors((current) => { if (!(id in current)) return current; const next = { ...current }; delete next[id]; return next; }), []);
  const blocking = Object.values(editors).find(({ state }) => [OWNER_SAVE_STATE.UNSAVED, OWNER_SAVE_STATE.SAVING, OWNER_SAVE_STATE.SAVE_FAILED, OWNER_SAVE_STATE.CONFLICT].includes(state));
  const confirmNavigation = useCallback(() => !blocking || window.confirm("未保存または保存未完了の入力があります。この画面を離れますか？"), [blocking]);
  useEffect(() => {
    if (!blocking) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [blocking]);
  const value = useMemo(() => ({ editors, blocking, report, release, confirmNavigation }), [editors, blocking, report, release, confirmNavigation]);
  return <OwnerEditGuardContext.Provider value={value}>{children}</OwnerEditGuardContext.Provider>;
}

export function useOwnerEditGuard(id, state, detail = "") {
  const context = useContext(OwnerEditGuardContext);
  const report = context?.report;
  const release = context?.release;
  useEffect(() => { if (!report || !release) return undefined; report(id, state, detail); return () => release(id); }, [report, release, id, state, detail]);
  return context;
}
export function useOwnerNavigationGuard() { return useContext(OwnerEditGuardContext); }
export function SaveState({ state = OWNER_SAVE_STATE.SAVED, detail = "" }) {
  const alert = state === OWNER_SAVE_STATE.SAVE_FAILED || state === OWNER_SAVE_STATE.CONFLICT;
  return <p className={`kv-save-state kv-save-state--${state.toLowerCase()}`} role={alert ? "alert" : "status"}><strong>{LABELS[state] || state}</strong>{detail ? <span>{detail}</span> : null}</p>;
}
