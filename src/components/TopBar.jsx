import { useRef } from "react";
import { useLocation } from "react-router-dom";
import { navigationContext } from "../app/navigation.js";
import BrandMark from "./BrandMark";

export default function TopBar({onMenuToggle,mobileOpen=false,onCollapseToggle,collapsed=false,onLogout,environment="Local"}){
  const ownerMenu=useRef(null),location=useLocation(),{title}=navigationContext(location.pathname);
  const closeOwnerMenu=(event)=>{if(event.key==="Escape"&&ownerMenu.current?.open){ownerMenu.current.open=false;ownerMenu.current.querySelector("summary")?.focus()}};
  return <header className="topbar" aria-label="アプリケーションヘッダー">
    <div className="topbar-left"><button type="button" className="kv-mobile-menu" aria-label="ナビゲーションを開く" aria-expanded={mobileOpen} aria-controls="production-navigation" onClick={onMenuToggle}>☰</button><button type="button" className="kv-collapse-trigger" aria-label={collapsed?"サイドバーを展開":"サイドバーを折りたたむ"} aria-pressed={collapsed} onClick={onCollapseToggle}>{collapsed?"›":"‹"}</button><BrandMark size={38}/><div className="kv-topbar-title"><p className="eyebrow">KEVIRIO</p><strong>{title}</strong><small>Owner Workspace</small></div></div>
    <div className="kv-topbar-context"><span className="kv-environment-label">{environment}</span><span className="kv-environment-label kv-locked-label">LOCKED</span><details ref={ownerMenu} className="kv-owner-menu" onKeyDown={closeOwnerMenu}><summary className="kv-owner-chip" aria-label="Ownerメニュー"><span className="kv-owner-avatar">O</span><span><strong>Owner</strong><small>認証済み</small></span></summary><div className="kv-owner-menu__panel"><p><strong>ワークスペース</strong><span>Owner Workspace</span></p><p><strong>環境</strong><span>{environment}</span></p><p><strong>外部実行</strong><span>LOCKED</span></p>{onLogout?<button type="button" onClick={onLogout}>ログアウト</button>:null}</div></details></div>
  </header>;
}