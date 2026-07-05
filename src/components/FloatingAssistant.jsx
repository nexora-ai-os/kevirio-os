export default function FloatingAssistant({ approvals, setPage }) {
  const waiting = approvals.filter((a) => a.status === "承認待ち").length;

  return (
    <button className="floating-ai" onClick={() => setPage("assistant")}>
      <strong>🤖 NEXORA AI</strong>
      <p>承認待ち {waiting}件。AIに相談する</p>
    </button>
  );
}
