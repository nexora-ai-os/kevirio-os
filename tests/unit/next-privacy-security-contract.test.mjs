import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const workspace = read("../../src/components/next/NextWorkspace.jsx");
const routes = read("../../src/app/routes.js");
const css = read("../../src/components/next/next-workspace.css");

test("legal checkpoint is explicitly non-durable and cannot activate an account", () => {
  for (const version of ["TERMS_1.0", "PRIVACY_1.0", "AI_NOTICE_1.0", "EXTERNAL_SERVICES_1.0", "LEARNING_OPT_IN_1.0"]) assert.match(workspace, new RegExp(version));
  assert.match(workspace, /DRAFT\s+[—-]\s+LEGAL REVIEW REQUIRED/);
  assert.match(workspace, /このチェックポイントでは永続同意記録を作成しません/);
  assert.match(workspace, /データベース移行とサーバー側有効化ゲート/);
  assert.doesNotMatch(workspace, /defaultChecked|localStorage|sessionStorage|fetch\(|\.rpc\(/);
  assert.match(workspace, /const ready=required\.every/);
  assert.match(workspace, /disabled=\{!ready\}/);
  assert.match(workspace, /LEARNING_OPT_IN_1\.0",false/);
});

test("privacy foundation is private-by-default", () => {
  for (const statement of ["個人ワークスペースは本人だけが閲覧", "Owner権限でも私的会話やSNS生データを通常閲覧しない", "共有は明示したデータだけ", "AI検索にも同じ権限境界を適用"]) assert.match(workspace, new RegExp(statement));
  assert.doesNotMatch(workspace, /Owner.{0,30}(?:すべて|全て).{0,20}(?:閲覧|アクセス)/);
});

test("manual surfaces introduce no provider, credential, or external-write code", () => {
  assert.doesNotMatch(workspace, /api\.openai\.com|api\.anthropic\.com|generativelanguage\.googleapis\.com/);
  assert.doesNotMatch(workspace, /service[_-]?role|access[_-]?token|refresh[_-]?token|client[_-]?secret|authorization\s*:/i);
  assert.doesNotMatch(workspace, /fetch\(|XMLHttpRequest|WebSocket|navigator\.sendBeacon/);
  assert.match(workspace, /Paid AI[^\n]{0,12}[¥￥]0/);
  assert.match(workspace, /外部自動実行[^\n]{0,16}停止中/);
});

test("legal and privacy routes do not replace authentication boundaries", () => {
  assert.match(routes, /\{path:"\/legal",page:"legal"\}/);
  assert.match(routes, /\{path:"\/team",page:"team"\}/);
  assert.doesNotMatch(routes, /\/auth\/callback|signIn|signUp|supabase\.auth/);
});

test("responsive workspace and browser matrix cover all required widths", () => {
  assert.match(css, /\.next-tabs\{[^}]*overflow-x:auto/);
  assert.match(css, /\.next-workspace\{[^}]*max-width:100%[^}]*overflow-x:hidden/);
  const phaseBrowser = read("../browser/next-phase1.spec.mjs");
  for (const width of [320,360,375,390,430,768,820,1024,1180,1280,1440]) assert.match(phaseBrowser, new RegExp(`(?:,|\\[)${width}(?:,|\\])`), `missing viewport ${width}`);
});

test("migration history remains additive and consent persistence is not misrepresented", () => {
  const names = readdirSync(new URL("../../supabase/migrations/", import.meta.url)).filter((name) => name.endsWith(".sql"));
  for (let index=3; index<=9; index+=1) assert.equal(names.filter((name) => name.startsWith(`${String(index).padStart(3,"0")}_`)).length,1);
  assert.equal(names.filter((name) => name.startsWith("018_")).length,1);
  assert.equal(names.filter((name) => name.startsWith("019_")).length,1);
  assert.match(workspace, /追加RLSと同意記録が必要/);
});

test("canonical Private Beta legal documents remain byte-stable and viewable before consent", () => {
  const expected = {
    "TERMS_1.0.md": "cd718abd6cc960020308473990df1dcb2f1ad39a74c4fd4d5bce1033db01f665",
    "PRIVACY_1.0.md": "fe78b6cf50f08d38c936e00c8e83f9b0fd2577ea96eee0b3f10a882ecdd4dc72",
    "AI_NOTICE_1.0.md": "280b5fccf3c0a1433475eda09e385de2da8f3e277b0026d571516e5c112781f1",
    "EXTERNAL_SERVICES_1.0.md": "11b3177ed76a15f153a9d90ccbcd841ea06602aebd42d58dbe751d357e9de922",
  };
  for (const [name, hash] of Object.entries(expected)) {
    const bytes = readFileSync(new URL(`../../public/legal/${name}`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), hash);
  }
  const surface = read("../../src/components/next/NextDurableSurfaces.jsx");
  assert.match(surface, /content_reference/);
  assert.match(surface, /全文を開く/);
  assert.doesNotMatch(surface, /defaultChecked/);
});

test("integration catalog is free-first, explicit, and keeps every external write locked", () => {
  const catalog = read("../../src/data/privateBetaIntegrationCatalog.js");
  for (const provider of ["OpenAI","Gemini","Gmail","Google Calendar","Google Drive","Google Analytics","Google Search Console","YouTube","Canva","Anthropic","Perplexity","A8.net","Instagram / Threads","X","TikTok"]) assert.match(catalog,new RegExp(provider.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
  for (const state of ["COST_POLICY_BLOCKED","CONFIGURED_NOT_ACTIVATED","MANUAL_OPERATION","API_ACCESS_PENDING","CONNECTED_FREE"]) assert.match(catalog,new RegExp(state));
  assert.doesNotMatch(catalog,/READY_FOR_OWNER_OAUTH/);
  const hub = read("../../src/components/ProviderHub.jsx");
  assert.match(hub,/externalExecution=\{false\}/);
  assert.match(hub,/PRIVATE_BETA_INTEGRATIONS/);
});
