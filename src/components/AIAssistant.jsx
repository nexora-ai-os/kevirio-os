import { useState } from "react";
import TopBar from "./TopBar";
import { buildAssistantReply, buildDraftFromAssistant } from "../services/aiCommand";

export default function AIAssistant({ programs, approvals, chatMessages, setChatMessages, setDraft, setPage, savedAt }) {
  const [input, setInput] = useState("");
  const waiting = approvals.filter((a) => a.status === "承認待ち").length;

  const send = (preset) => {
    const value = preset || input;
    if (!value.trim()) return;

    const userMessage = { id: Date.now(), role: "user", text: value };
    const assistantMessage = {
      id: Date.now() + 1,
      role: "assistant",
      text: buildAssistantReply(value, programs, approvals),
    };

    setChatMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
  };

  const createDraft = () => {
    setDraft(buildDraftFromAssistant(programs));
    setPage("content");
  };

  return (
    <main className="content">
      <TopBar notifications={waiting} savedAt={savedAt} />

      <div className="panel assistant-panel">
        <h1>AI Companion</h1>
        <p className="muted">v1.7では疑似AIです。次フェーズでOpenAI / Geminiへ接続します。</p>

        <div className="actions">
          <button onClick={() => send("今日やることを整理して")}>今日やること</button>
          <button onClick={() => send("PLAUD投稿案を作って")}>PLAUD投稿案</button>
          <button onClick={() => send("承認待ちを確認して")}>承認待ち確認</button>
          <button onClick={createDraft}>Content Studioへ送る</button>
        </div>

        <div className="chat-window">
          {chatMessages.map((m) => (
            <div className={`chat-bubble ${m.role}`} key={m.id}>
              <strong>{m.role === "user" ? "健さん" : "KEVIRIO AI"}</strong>
              <p>{m.text}</p>
            </div>
          ))}
        </div>

        <div className="chat-input">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="例：今日やることを整理して" />
          <button onClick={() => send()}>送信</button>
        </div>
      </div>
    </main>
  );
}
