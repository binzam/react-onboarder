// Prepends the "use client" directive to the client bundles (dist/index.*).
// It is inserted on the first line without a newline so sourcemaps stay aligned.
import { readFile, writeFile } from "node:fs/promises";

const DIRECTIVE = '"use client";';

for (const file of ["dist/index.js", "dist/index.cjs"]) {
  const source = await readFile(file, "utf8");
  if (source.startsWith(DIRECTIVE)) continue;
  await writeFile(file, DIRECTIVE + source);
}
