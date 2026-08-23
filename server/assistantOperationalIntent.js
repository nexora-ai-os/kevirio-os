const CREATE_CONTENT = /(?:投稿|コンテンツ).{0,12}(?:作って|作成して|書いて|下書き)/i;
const ASK_CONTENT = /(?:投稿|コンテンツ).{0,12}(?:作り方|方法|どうやって)/i;

export function resolveAssistantOperationalIntent(value) {
  const text = String(value || "").normalize("NFKC").trim().replace(/\s+/g, " ");
  if (!text || ASK_CONTENT.test(text) || !CREATE_CONTENT.test(text)) return Object.freeze({ intent: "ASK", action: null });
  const subject = text
    .replace(/(?:Threads|Instagram|X|SNS)(?:で|向けの?)?/gi, "")
    .replace(/(?:投稿|コンテンツ).{0,12}(?:作って|作成して|書いて|下書き)(?:ください)?/gi, "")
    .replace(/(?:について|テーマは|内容は|題材は)/g, " ")
    .trim();
  if (subject.length < 4) return Object.freeze({ intent: "CREATE", action: "CLARIFY", missing: "subject" });
  return Object.freeze({ intent: "CREATE", action: "CREATE_CONTENT_DRAFT", subject: subject.slice(0, 240), specialist: "content_strategy" });
}

const PROVIDER_NEEDS_CONTEXT = /(?:情報|内容|進捗|対象).{0,18}(?:不足|不明|教えて|ご教示)|作成することができません/;
export function providerRequiresClarification(value) { return PROVIDER_NEEDS_CONTEXT.test(String(value || "")); }
