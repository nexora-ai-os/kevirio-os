import { useNavigate } from "react-router-dom";
import NextDurableAssistant from "./next/NextDurableAssistant.jsx";

export default function ConnectedAssistant({ client }) {
  const navigate = useNavigate();
  return <>
    <NextDurableAssistant client={client} />
    <div className="next-workspace">
      <section className="next-card next-card--wide">
        <h2>Google接続ルーティング</h2>
        <p>外部AI生成ではなく、接続済みread-only workflowへ案内します。</p>
        <div className="next-actions">
          <button className="next-link" onClick={() => navigate("/home?google=calendar")}>今日の予定を見る</button>
          <button className="next-link" onClick={() => navigate("/home?google=gmail")}>最近のメールを見る</button>
          <button className="next-link" onClick={() => navigate("/home?google=drive")}>Driveを探す</button>
        </div>
        <p className="next-note">Provider dataはOwnerが「Googleを更新」を押すまで取得しません。</p>
      </section>
    </div>
  </>;
}
