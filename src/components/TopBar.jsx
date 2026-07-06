import BrandMark from "./BrandMark";

export default function TopBar({ notifications = 0, savedAt = "未保存" }) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <BrandMark size={42} />
        <div>
          <p className="eyebrow">KEVIRIO MISSION CONTROL</p>
          <strong>Good Morning, Ken</strong>
          <p className="muted">保存状態：{savedAt}</p>
        </div>
      </div>
      <div className="top-actions">
        <button className="icon-btn">🔔 {notifications}</button>
        <button className="profile-btn">KEN</button>
      </div>
    </div>
  );
}
