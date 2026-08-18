import { unlink } from "node:fs/promises";
import { AUTH_FILE } from "./support.mjs";

export default async function globalTeardown() {
  await unlink(AUTH_FILE).catch((error) => { if (error.code !== "ENOENT") throw error; });
}
