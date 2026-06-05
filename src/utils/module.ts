import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function isMainModule(importMetaUrl: string): boolean {
  return resolve(fileURLToPath(importMetaUrl)) === resolve(process.argv[1] ?? "");
}
