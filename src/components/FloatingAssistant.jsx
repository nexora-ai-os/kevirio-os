export default function FloatingAssistant({ approvals, setPage }) {
  const waiting = approvals.filter((a) => a.status === "承認待ち").length;

  return (
    <button className="floating-ai" onClick={() => setPage("assistant")}>
      <strong>✨ KEVIRIO AI</strong>
      <p>承認待ち {waiting}件。AI Companionに相談する</p>
    </button>
  );
}
