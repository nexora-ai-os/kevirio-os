import { Fragment } from "react";

const LIST_ITEM = /^\s*([-*+] |\d+[.)] )(.*)$/;

export default function AssistantMarkdown({ content }) {
  const lines = String(content || "").split(/\r?\n/);
  const blocks = [];
  let paragraph = [], list = [], ordered = false, code = [], inCode = false;
  const flushParagraph = () => { if (paragraph.length) { blocks.push({ type: "paragraph", lines: paragraph }); paragraph = []; } };
  const flushList = () => { if (list.length) { blocks.push({ type: ordered ? "ol" : "ul", items: list }); list = []; } };
  const flushCode = () => { blocks.push({ type: "code", text: code.join("\n") }); code = []; };
  for (const line of lines) {
    if (/^```/.test(line)) { flushParagraph(); flushList(); if (inCode) flushCode(); inCode = !inCode; continue; }
    if (inCode) { code.push(line); continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/), item = line.match(LIST_ITEM);
    if (heading) { flushParagraph(); flushList(); blocks.push({ type: `h${heading[1].length + 2}`, text: heading[2] }); }
    else if (item) { flushParagraph(); const nextOrdered = /^\d/.test(item[1]); if (list.length && ordered !== nextOrdered) flushList(); ordered = nextOrdered; list.push(item[2]); }
    else if (!line.trim()) { flushParagraph(); flushList(); }
    else { flushList(); paragraph.push(line); }
  }
  flushParagraph(); flushList(); if (inCode || code.length) flushCode();
  return <div className="assistant-2__markdown">{blocks.map((block, index) => {
    if (block.type === "paragraph") return <p key={index}>{block.lines.map((line, lineIndex) => <Fragment key={lineIndex}>{lineIndex ? <br /> : null}{line}</Fragment>)}</p>;
    if (block.type === "ul") return <ul key={index}>{block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</ul>;
    if (block.type === "ol") return <ol key={index}>{block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</ol>;
    if (block.type === "code") return <pre key={index}><code>{block.text}</code></pre>;
    const Heading = block.type;
    return <Heading key={index}>{block.text}</Heading>;
  })}</div>;
}
