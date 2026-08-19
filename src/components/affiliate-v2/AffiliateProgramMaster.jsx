import { useMemo, useState } from "react";
import { Badge, Button, Card, FormField, Input, SectionHeader, Select, Table } from "../../design-system/index.js";
import { listingComplianceLabel } from "../../domain/affiliateProgramMaster.js";

const value = (input, suffix = "") => input == null ? "Unknown" : `${input}${suffix}`;

export default function AffiliateProgramMaster({ programs = [], available = true, onSaveLink }) {
  const [selectedId, setSelectedId] = useState(null);
  const selected = useMemo(() => programs.find((program) => program.id === selectedId) || null, [programs, selectedId]);
  const columns = [
    { key: "programName", label: "Program Name", render: (row) => <button type="button" className="av2-program-link" onClick={() => setSelectedId(row.id)}>{row.programName}</button> },
    { key: "advertiserName", label: "Advertiser" }, { key: "aspName", label: "ASP" }, { key: "category", label: "Category", render: (row) => row.category || "Unknown" },
    { key: "rewardSummary", label: "Reward", render: (row) => row.rewardSummary || "Unknown" }, { key: "epc", label: "EPC", render: (row) => value(row.epc) },
    { key: "approvalRate", label: "Approval Rate", render: (row) => value(row.approvalRate, "%") }, { key: "programStatus", label: "Program Status" },
    { key: "affiliateLinkStatus", label: "Affiliate Link" }, { key: "compliance", label: "Listing Compliance", render: (row) => <Badge label={listingComplianceLabel(row)} state={row.listingVerificationStatus === "CONFIRMED" ? "actual" : "pending"}/> },
  ];
  return <section aria-labelledby="affiliate-program-master-title"><SectionHeader title="Affiliate Program Master" description={`${available?programs.length:"Unknown"} programs · Source: Owner-provided A8.net screenshots`}/><Table caption="Affiliate Program Master" columns={columns} rows={programs} emptyTitle={available?"Program Masterに登録はありません":"Program Masterを確認できません"} emptyMessage={available?"最初の案件を登録してください。":"未取得をゼロとは扱いません。"}/>{selected ? <ProgramDetail program={selected} onClose={() => setSelectedId(null)} onSaveLink={onSaveLink}/> : null}</section>;
}

function ProgramDetail({ program, onClose, onSaveLink }) {
  const [url, setUrl] = useState(program.affiliateUrl || "");
  const [status, setStatus] = useState(program.affiliateLinkStatus === "NOT_REGISTERED" ? "ACTIVE" : program.affiliateLinkStatus);
  const [save, setSave] = useState({ pending: false, error: null, done: false });
  const submit = async (event) => { event.preventDefault(); setSave({ pending: true, error: null, done: false }); try { await onSaveLink(program.id, { affiliateUrl: url, linkStatus: status }); setSave({ pending: false, error: null, done: true }); } catch (error) { setSave({ pending: false, error: error?.code || "SAVE_FAILED", done: false }); } };
  return <Card className="av2-program-detail"><div className="av2-program-detail__header"><div><p className="eyebrow">PROGRAM DETAIL</p><h3>{program.programName}</h3><p>{program.advertiserName} · {program.aspName} · {program.programId}</p></div><Button variant="secondary" onClick={onClose}>閉じる</Button></div><dl className="av2-data-grid"><div><dt>Category</dt><dd>{program.category || "Unknown"}</dd></div><div><dt>Reward</dt><dd>{program.rewardSummary || "Unknown"}</dd></div><div><dt>EPC</dt><dd>{value(program.epc)}</dd></div><div><dt>Approval Rate</dt><dd>{value(program.approvalRate, "%")}</dd></div><div><dt>Revisit Window</dt><dd>{value(program.revisitWindowDays, " days")}</dd></div><div><dt>Confirmation</dt><dd>{value(program.confirmationDays, " days")}</dd></div></dl><SectionHeader title="Compliance"/><dl className="av2-data-grid"><div><dt>リスティング制限</dt><dd>{program.listingPolicy}</dd></div><div><dt>確認状態</dt><dd>{listingComplianceLabel(program)}</dd></div><div><dt>Source</dt><dd>{program.sourceType}</dd></div><div><dt>確認日時</dt><dd>{program.sourceVerifiedAt || "Unknown"}</dd></div></dl><div><h4>リスティングNGワード</h4>{program.listingNgWords === null ? <p role="status">未確認</p> : <ul>{program.listingNgWords.map((word, index) => <li key={`${index}-${word}`}>{word}</li>)}</ul>}<p className="av2-source-raw">原文: {program.listingNgWordsRaw || "未確認"}</p></div><form onSubmit={submit}><SectionHeader title="Affiliate URL" description="Owner-only · http/https only"/><FormField label="Affiliate URL" error={save.error}><Input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://" pending={save.pending}/></FormField><FormField label="Link Status"><Select value={status} onChange={(event) => setStatus(event.target.value)} pending={save.pending}><option value="ACTIVE">ACTIVE</option><option value="PAUSED">PAUSED</option><option value="EXPIRED">EXPIRED</option></Select></FormField><div className="av2-action-row"><Button type="submit" pending={save.pending}>広告リンクを保存</Button><Button type="button" variant="secondary" onClick={() => { setUrl(""); setStatus("ACTIVE"); }}>登録解除</Button></div>{save.done ? <p role="status">保存しました。</p> : null}</form></Card>;
}
