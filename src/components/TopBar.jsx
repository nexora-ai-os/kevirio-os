import { useRef } from "react";
import BrandMark from "./BrandMark";

export default function TopBar({ onMenuToggle, mobileOpen = false, onLogout, environment = "ローカル開発環境" }) {
  const ownerMenu = useRef(null);
  const closeOwnerMenu = (event) => {
    if (event.key === "Escape" && ownerMenu.current?.open) {
      ownerMenu.current.open = false;
      ownerMenu.current.querySelector("summary")?.focus();
    }
  };
  return <header className="topbar" aria-label="アプリケーションツールバー">
    <div className="topbar-left"><button type="button" className="kv-mobile-menu" aria-label="ナビゲーションを開く" aria-expanded={mobileOpen} aria-controls="production-navigation" onClick={onMenuToggle}>☰</button><BrandMark size={38} /><div><p className="eyebrow">KEVIRIO</p><strong>Owner コントロールセンター</strong></div></div>
    <div className="kv-topbar-context"><span className="kv-system-status"><i aria-hidden="true" />実行境界を保護中</span><span className="kv-environment-label">{environment}</span><details ref={ownerMenu} className="kv-owner-menu" onKeyDown={closeOwnerMenu}><summary className="kv-owner-chip" aria-label="Ownerメニュー"><span className="kv-owner-avatar">O</span><span><strong>Owner</strong><small>認証済み</small></span></summary><div className="kv-owner-menu__panel"><p><strong>ワークスペース</strong><span>Owner Workspace</span></p><p><strong>環境</strong><span>{environment}</span></p><p><strong>セッション</strong><span>認証済み</span></p><button type="button" onClick={onLogout}>ログアウト</button></div></details></div>
  </header>;
}
