import { cloneElement, isValidElement, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../services/supabaseBrowserClient";
import { OWNER_AUTH_STATES, resolveOwnerAuthState } from "../services/ownerAuthState";
import BrandMark from "./BrandMark";
import { DurableLegal } from "./next/NextDurableSurfaces.jsx";
import { bootstrapPersonalWorkspace } from "../repositories/personalWorkspaceRepository.js";

export const OWNER_LOGIN_ERROR = Object.freeze({
  INVALID_CREDENTIALS: "メールアドレスまたはパスワードが一致しません。入力内容を確認して、もう一度お試しください。",
  EMAIL_NOT_CONFIRMED: "メールアドレスの確認が完了していません。",
  RATE_LIMITED: "ログイン試行回数が多すぎます。時間を置いてからもう一度お試しください。",
  NETWORK: "認証サーバーに接続できませんでした。通信状況を確認して、もう一度お試しください。",
  UNKNOWN: "ログイン処理を完了できませんでした。時間を置いてからもう一度お試しください。",
});

export function ownerLoginErrorMessage(error) {
  const code = String(error?.code || "").toLowerCase();
  const status = Number(error?.status || 0);
  if (code === "invalid_credentials") return OWNER_LOGIN_ERROR.INVALID_CREDENTIALS;
  if (code === "email_not_confirmed") return OWNER_LOGIN_ERROR.EMAIL_NOT_CONFIRMED;
  if (code === "too_many_requests" || code.includes("rate_limit") || status === 429) return OWNER_LOGIN_ERROR.RATE_LIMITED;
  if (code.includes("network") || code === "fetch_error") return OWNER_LOGIN_ERROR.NETWORK;
  return OWNER_LOGIN_ERROR.UNKNOWN;
}

const wait=(milliseconds)=>new Promise(resolve=>window.setTimeout(resolve,milliseconds));
const withDeadline=async(task,milliseconds=8000)=>{let timer;try{return await Promise.race([task,new Promise((_,reject)=>{timer=window.setTimeout(()=>reject(new Error("AUTH_BOOT_TIMEOUT")),milliseconds)})])}finally{window.clearTimeout(timer)}};
const bootstrapWithRetry=async client=>{try{return await withDeadline(bootstrapPersonalWorkspace(client))}catch{await wait(300);return withDeadline(bootstrapPersonalWorkspace(client))}};

export default function SupabaseOwnerAuthGate({ children }) {
  const client = useMemo(() => createSupabaseBrowserClient(), []);
  const [session, setSession] = useState(null);
  const [ownerState, setOwnerState] = useState(OWNER_AUTH_STATES.LOADING);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loginErrorCode, setLoginErrorCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [lifecycleState, setLifecycleState] = useState(null);
  const environmentLabel = import.meta.env.PROD ? "KEVIRIO Production" : "ローカル開発環境";

  useEffect(() => {
    if (!client) { setOwnerState(OWNER_AUTH_STATES.PROVIDER_UNAVAILABLE); return undefined; }
    let active = true;
    let requestSequence = 0;
    let applying = false;
    const applySession = async (next) => {
      if (applying) return;
      applying = true;
      const requestId = ++requestSequence;
      try{
        if (!active) return;
        setSession(next || null);
        if (next?.user?.id) {
          try { await bootstrapWithRetry(client); }
          catch { if (active && requestId === requestSequence) { setOwnerState(OWNER_AUTH_STATES.PROVIDER_UNAVAILABLE); return; } }
        }
        if(next?.user?.id){const lifecycle=await client.from("user_account_states").select("lifecycle_state").eq("user_id",next.user.id).maybeSingle();if(active&&requestId===requestSequence)setLifecycleState(lifecycle.data?.lifecycle_state||null)}else setLifecycleState(null);
        const state = await resolveOwnerAuthState(client, next);
        if (active && requestId === requestSequence) setOwnerState(state);
      }finally{applying=false}
    };
    client.auth.getSession()
      .then(({ data, error }) => error ? setOwnerState(OWNER_AUTH_STATES.SESSION_EXPIRED) : applySession(data.session))
      .catch(() => setOwnerState(OWNER_AUTH_STATES.PROVIDER_UNAVAILABLE));
    const { data } = client.auth.onAuthStateChange((event, next) => {
      if (event === "TOKEN_REFRESH_FAILED") { setSession(null); setOwnerState(OWNER_AUTH_STATES.SESSION_EXPIRED); return; }
      setTimeout(() => { if (active) applySession(next); }, 0);
    });
    const recheck=()=>{if(document.visibilityState==="visible")client.auth.getSession().then(({data:current})=>applySession(current.session)).catch(()=>setOwnerState(OWNER_AUTH_STATES.PROVIDER_UNAVAILABLE))};
    const interval=window.setInterval(recheck,5000);window.addEventListener("focus",recheck);document.addEventListener("visibilitychange",recheck);
    return () => { active = false; window.clearInterval(interval);window.removeEventListener("focus",recheck);document.removeEventListener("visibilitychange",recheck);data.subscription.unsubscribe(); };
  }, [client]);

  const signIn = async (event) => {
    event.preventDefault();
    if (!client || submitting) return;
    setSubmitting(true); setMessage(""); setLoginErrorCode(""); setOwnerState(OWNER_AUTH_STATES.LOADING);
    try {
      const { error } = await client.auth.signInWithPassword({ email, password });
      setPassword(""); setCapsLock(false);
      if (error) { setOwnerState(OWNER_AUTH_STATES.UNAUTHENTICATED); setLoginErrorCode(String(error.code || "").toLowerCase()); setMessage(ownerLoginErrorMessage(error)); }
    } catch {
      setPassword(""); setCapsLock(false); setLoginErrorCode("network"); setOwnerState(OWNER_AUTH_STATES.UNAUTHENTICATED); setMessage(OWNER_LOGIN_ERROR.NETWORK);
    } finally { setSubmitting(false); }
  };
  const signOut = async () => { if (!client) return; await client.auth.signOut(); setSession(null); setOwnerState(OWNER_AUTH_STATES.UNAUTHENTICATED); };

  if (ownerState === OWNER_AUTH_STATES.LOADING) return <AuthPanel title="Owner認証を確認中" body="安全なSessionを確認しています。" loading />;
  if (ownerState === OWNER_AUTH_STATES.PROVIDER_UNAVAILABLE) return <AuthPanel title="認証Providerを利用できません" body="Business dataは表示されません。Supabaseの公開設定を確認してください。" />;
  if (ownerState === OWNER_AUTH_STATES.SESSION_EXPIRED) return <AuthPanel title="Sessionの有効期限が切れました" body="もう一度ログインしてください。"><button type="button" onClick={() => setOwnerState(OWNER_AUTH_STATES.UNAUTHENTICATED)}>ログインへ</button></AuthPanel>;
  if (ownerState === OWNER_AUTH_STATES.NOT_OWNER || ownerState === OWNER_AUTH_STATES.INACTIVE) return <AuthPanel title="Owner権限を確認できません" body={ownerState === OWNER_AUTH_STATES.INACTIVE ? "このOwner accountは無効です。" : "このaccountにはOwner権限がありません。"}><button type="button" onClick={signOut}>ログアウト</button></AuthPanel>;
  if (!session) return <main className="auth-shell"><section className="auth-panel" aria-labelledby="owner-login-title"><header className="auth-brand"><BrandMark size={72} /><div><p>AI COMPANY OPERATING SYSTEM</p><strong>KEVIRIO</strong></div><span className="auth-environment">{environmentLabel}</span></header><div className="auth-heading"><p className="auth-eyebrow">OWNER ACCESS</p><h1 id="owner-login-title">Ownerログイン</h1><p>会社の意思決定とAI社員の運用環境へ、安全にアクセスします。</p></div><form className="auth-form" onSubmit={signIn}><label htmlFor="owner-email">メールアドレス</label><input id="owner-email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" inputMode="email" spellCheck="false" required /><label htmlFor="owner-password">パスワード</label><div className="auth-password-field"><input id="owner-password" name="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => setCapsLock(event.getModifierState("CapsLock"))} onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))} onBlur={() => setCapsLock(false)} autoComplete="current-password" aria-describedby={capsLock ? "owner-caps-lock" : undefined} required /><button type="button" className="auth-password-toggle" aria-label={showPassword ? "パスワードを非表示にする" : "パスワードを表示する"} aria-pressed={showPassword} onMouseDown={(event) => event.preventDefault()} onClick={() => setShowPassword((current) => !current)}>{showPassword ? "非表示" : "表示"}</button></div>{capsLock ? <p id="owner-caps-lock" className="auth-caps-lock" role="status">Caps Lockがオンになっています。</p> : null}<button className="auth-submit" type="submit" disabled={submitting} aria-busy={submitting}>{submitting ? "確認中…" : "ログイン"}</button>{message ? <div className="auth-error" role="alert" aria-live="assertive"><p>{message}</p>{loginErrorCode === "invalid_credentials" ? <ul className="auth-error-hints"><li>Caps Lockがオンになっていないか確認してください。</li><li>パスワード表示ボタンで入力内容を確認できます。</li></ul> : null}</div> : null}</form><div className="auth-recovery" role="note"><span>パスワードを忘れた場合</span><small>再設定機能は現在準備中です。</small></div><p className="auth-security-note">認証情報はKEVIRIOの画面・ログ・Repositoryには保存されません。</p></section></main>;

  if (ownerState === OWNER_AUTH_STATES.CONSENT_REQUIRED) return <main className="auth-shell"><section className="auth-panel">{lifecycleState==="INVITED"||lifecycleState==="REGISTERING"?<MemberRegistration client={client} onComplete={()=>{setLifecycleState("CONSENT_REQUIRED");setOwnerState(OWNER_AUTH_STATES.CONSENT_REQUIRED)}}/>:<DurableLegal client={client}/>}<button type="button" onClick={() => resolveOwnerAuthState(client, session).then(setOwnerState)}>同意状態を再確認</button><button type="button" onClick={signOut}>ログアウト</button></section></main>;
  if (ownerState === OWNER_AUTH_STATES.SUSPENDED || ownerState === OWNER_AUTH_STATES.DEACTIVATED) return <AuthPanel title={ownerState === OWNER_AUTH_STATES.SUSPENDED ? "利用停止中" : "無効なアカウント"} body="現在のアカウント状態では通常機能を利用できません。"><button type="button" onClick={signOut}>ログアウト</button></AuthPanel>;

  const getOwnerAccessToken = () => session?.access_token || null;
  const content = isValidElement(children) ? cloneElement(children, { getOwnerAccessToken, ownerSession: session, ownerSupabaseClient: client, onOwnerLogout: signOut }) : children;
  return content;
}

function AuthPanel({ title, body, children, loading = false }) {
  return <main className="auth-shell" aria-busy={loading||undefined}><section className="auth-panel auth-panel--message"><BrandMark size={64} /><h1>{title}</h1><p>{body}</p>{loading ? <span className="auth-loader" aria-hidden="true" /> : children}</section></main>;
}

function MemberRegistration({client,onComplete}){
  const[password,setPassword]=useState(""),[confirmation,setConfirmation]=useState(""),[message,setMessage]=useState(""),[saving,setSaving]=useState(false);
  const submit=async event=>{event.preventDefault();if(password.length<8){setMessage("パスワードは8文字以上で入力してください。");return}if(password!==confirmation){setMessage("確認用パスワードが一致しません。");return}setSaving(true);setMessage("");try{const updated=await client.auth.updateUser({password});if(updated.error)throw updated.error;const completed=await client.rpc("complete_member_registration");if(completed.error)throw completed.error;setPassword("");setConfirmation("");onComplete()}catch{setMessage("登録を完了できませんでした。通信状態を確認して、もう一度お試しください。")}finally{setSaving(false)}};
  return <div><h1>メンバー登録</h1><p>自分専用のパスワードを設定すると、必須文書の確認へ進みます。</p><form className="auth-form" onSubmit={submit}><label htmlFor="member-password">パスワード</label><input id="member-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={event=>setPassword(event.target.value)}/><label htmlFor="member-password-confirmation">パスワード（確認）</label><input id="member-password-confirmation" type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={event=>setConfirmation(event.target.value)}/><button type="submit" className="auth-submit" disabled={saving} aria-busy={saving}>{saving?"登録中…":"登録して文書確認へ"}</button>{message?<p role="alert">{message}</p>:null}</form><p className="auth-security-note">Personal Workspaceは自分専用です。Ownerを含む他ユーザーへ個人データは自動共有されません。</p></div>;
}
