import "./next-workspace.css";
import { DurableContent, DurableFeedback, DurableLegal, DurableOpportunities } from "./NextDurableSurfaces.jsx";

const TITLES={content:"コンテンツ制作",opportunities:"仕事を探す",feedback:"改善BOX",legal:"法的文書と同意"};
export default function NextDurablePage({page,client}){let body=null;if(page==="content")body=<DurableContent client={client}/>;if(page==="opportunities")body=<DurableOpportunities client={client}/>;if(page==="feedback")body=<DurableFeedback client={client}/>;if(page==="legal")body=<DurableLegal client={client}/>;return <main className="next-workspace"><header className="next-header"><div><span>KEVIRIO NEXT</span><h1>{TITLES[page]||"KEVIRIO"}</h1><p>認証済みの個人ワークスペースへ、保護された経路で保存します。</p></div><div className="next-header__state"><span className="next-state next-state--blocked">外部自動実行 停止中</span><small>Paid AI ¥0</small></div></header>{body}</main>}
