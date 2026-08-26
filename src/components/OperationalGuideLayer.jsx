import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useOwnerNavigationGuard } from "../app/ownerEditGuard.jsx";

const RESUME_KEY = "kevirio.owner.resume-pointer.v1";
const LABELS = Object.freeze({ home: "ホーム", assistant: "AI秘書", goals: "目標・戦略", affiliate: "アフィリエイト", content: "コンテンツ制作", opportunities: "案件探索", outreach: "応募・営業", projects: "プロジェクト", revenue: "収益管理", crm: "顧客・CRM", knowledge: "Knowledge", feedback: "改善BOX", settings: "設定" });
function pageLabel(pathname) { const key = pathname.split("/").filter(Boolean)[0] || "home"; return LABELS[key] || "現在の業務"; }
function readResume() { try { return JSON.parse(window.localStorage.getItem(RESUME_KEY) || "null"); } catch { return null; } }

export default function OperationalGuideLayer() {
  const location = useLocation(), navigate = useNavigate(), editGuard = useOwnerNavigationGuard();
  const [open, setOpen] = useState(false), [active, setActive] = useState(null), [resume, setResume] = useState(readResume);
  useEffect(() => {
    const receive = (event) => setActive(event.detail ? { ...event.detail, path: window.location.pathname } : null);
    window.addEventListener("kevirio:active-work", receive);
    return () => window.removeEventListener("kevirio:active-work", receive);
  }, []);
  useEffect(() => {
    if (location.pathname === "/home") return;
    const pointer = { path: `${location.pathname}${location.search}`, label: active?.path === location.pathname ? active.title : pageLabel(location.pathname), at: new Date().toISOString() };
    try { window.localStorage.setItem(RESUME_KEY, JSON.stringify(pointer)); setResume(pointer); } catch { /* navigation pointer is optional */ }
  }, [location.pathname, location.search, active?.title]);
  const save = editGuard?.blocking;
  const currentActive = active?.path === location.pathname ? active : null;
  const model = useMemo(() => ({
    title: currentActive?.title || pageLabel(location.pathname),
    state: currentActive?.state || (location.pathname === "/home" ? "今日の業務を確認中" : "canonical dataを確認中"),
    progress: currentActive?.progress || "現在の画面",
    next: save ? "入力を保存または破棄してから移動" : currentActive?.next || "画面内のprimary actionを確認",
    blocker: save?.detail || (save ? "保存未完了" : currentActive?.blocker || "なし"),
  }), [currentActive, location.pathname, save]);
  const goResume = () => { if (resume?.path && editGuard?.confirmNavigation() !== false) navigate(resume.path); };
  return <aside className={`kv-operational-guide ${open ? "kv-operational-guide--open" : ""}`} aria-label="Operational Guide">
    <button type="button" className="kv-operational-guide__toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>作業ガイド</button>
    <div className="kv-operational-guide__body">
      <div><small>ACTIVE WORK</small><strong>{model.title}</strong></div><div><small>CURRENT STATE</small><span>{model.state}</span></div><div><small>WORKFLOW PROGRESS</small><span>{model.progress}</span></div><div><small>NEXT RECOMMENDED ACTION</small><span>{model.next}</span></div><div><small>BLOCKER / MISSING</small><span>{model.blocker}</span></div><div><small>SAVE STATE</small><span>{save ? save.state : "SAVED"}</span></div>
      {location.pathname === "/home" && resume?.path ? <button type="button" onClick={goResume}>前回の作業を続ける：{resume.label}</button> : null}
    </div>
  </aside>;
}
