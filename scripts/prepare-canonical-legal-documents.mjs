import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Usage: node scripts/prepare-canonical-legal-documents.mjs <approved-package.txt>");
const source = (await readFile(resolve(sourcePath), "utf8")).replace(/\r\n/g, "\n");
const documents = ["TERMS_1.0", "PRIVACY_1.0", "AI_NOTICE_1.0", "EXTERNAL_SERVICES_1.0"];
await mkdir(resolve("public/legal"), { recursive: true });

for (const [index, version] of documents.entries()) {
  const start = source.indexOf(`# ${version}\n`);
  const endMarker = `**END OF ${version}**`;
  const end = source.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error(`Approved document not found: ${version}`);
  let content = source.slice(start, end + endMarker.length).trimEnd() + "\n";
  if (index === 0) content = content.replace("`[運営主体または氏名を記載]`", "運営 細谷").replace("`[連絡用メールアドレスを記載]`", "[nexora.ken@gmail.com](mailto:nexora.ken@gmail.com)");
  if (index === 1) content = content.replace("`[運営主体または氏名]`", "運営 細谷").replace("`[連絡用メールアドレス]`", "[nexora.ken@gmail.com](mailto:nexora.ken@gmail.com)");
  if (content.includes("[運営主体") || content.includes("[連絡用メール")) throw new Error(`Unresolved operator placeholder: ${version}`);
  await writeFile(resolve(`public/legal/${version}.md`), content, "utf8");
}
