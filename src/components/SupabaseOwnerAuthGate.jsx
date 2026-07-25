import { cloneElement, isValidElement, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../services/supabaseBrowserClient";
import { OWNER_AUTH_STATES, resolveOwnerAuthState } from "../services/ownerAuthState";

export default function SupabaseOwnerAuthGate({ children }) {
  const client = useMemo(() => createSupabaseBrowserClient(), []);
  const [session, setSession] = useState(null);
  const [ownerState, setOwnerState] = useState(OWNER_AUTH_STATES.LOADING);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!client) { setOwnerState(OWNER_AUTH_STATES.PROVIDER_UNAVAILABLE); return undefined; }
    let active = true;
    const applySession = async (next) => {
      if (!active) return;
      setSession(next || null);
      const state = await resolveOwnerAuthState(client, next);
      if (active) setOwnerState(state);
    };
    client.auth.getSession()
      .then(({ data, error }) => error ? setOwnerState(OWNER_AUTH_STATES.SESSION_EXPIRED) : applySession(data.session))
      .catch(() => setOwnerState(OWNER_AUTH_STATES.PROVIDER_UNAVAILABLE));
    const { data } = client.auth.onAuthStateChange((event, next) => {
      if (event === "TOKEN_REFRESH_FAILED") {
        setSession(null);
        setOwnerState(OWNER_AUTH_STATES.SESSION_EXPIRED);
        return;
      }
      applySession(next);
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [client]);

  const signIn = async (event) => {
    event.preventDefault();
    if (!client) return;
    setOwnerState(OWNER_AUTH_STATES.LOADING);
    const { error } = await client.auth.signInWithPassword({ email, password });
    setPassword("");
    if (error) {
      setOwnerState(OWNER_AUTH_STATES.UNAUTHENTICATED);
      setMessage("Ownerログインを確認できませんでした。");
    } else setMessage("");
  };
  const signOut = async () => {
    if (!client) return;
    await client.auth.signOut();
    setSession(null);
    setOwnerState(OWNER_AUTH_STATES.UNAUTHENTICATED);
  };

  if (ownerState === OWNER_AUTH_STATES.LOADING) return <AuthPanel title="Owner認証を確認中" body="安全なSessionを確認しています。" />;
  if (ownerState === OWNER_AUTH_STATES.PROVIDER_UNAVAILABLE) return <AuthPanel title="認証Providerを利用できません" body="Business dataは表示されません。Supabaseの公開設定を確認してください。" />;
  if (ownerState === OWNER_AUTH_STATES.SESSION_EXPIRED) return <AuthPanel title="Sessionの有効期限が切れました" body="再度ログインしてください。"><button onClick={() => setOwnerState(OWNER_AUTH_STATES.UNAUTHENTICATED)}>ログインへ</button></AuthPanel>;
  if (ownerState === OWNER_AUTH_STATES.NOT_OWNER || ownerState === OWNER_AUTH_STATES.INACTIVE) {
    return <AuthPanel title="Owner権限を確認できません" body={ownerState === OWNER_AUTH_STATES.INACTIVE ? "このOwner accountは無効です。" : "このaccountにはOwner権限がありません。"}><button onClick={signOut}>Logout</button></AuthPanel>;
  }
  if (!session) {
    return <main className="auth-shell"><section className="panel"><h1>Ownerログイン</h1><form onSubmit={signIn}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label><button type="submit">ログイン</button></form>{message && <p role="alert">{message}</p>}</section></main>;
  }

  const getOwnerAccessToken = () => session?.access_token || null;
  const content = isValidElement(children) ? cloneElement(children, { getOwnerAccessToken, ownerSession: session, ownerSupabaseClient: client }) : children;
  return <><div className="owner-auth-toolbar"><span>Owner session verified</span><button type="button" onClick={signOut}>Logout</button></div>{content}</>;
}

function AuthPanel({ title, body, children }) {
  return <main className="auth-shell"><section className="panel"><h1>{title}</h1><p>{body}</p>{children}</section></main>;
}
