// Packs the library exactly as it would be published, then lints the tarball
// with publint and "Are the types wrong?". It packs with pnpm because this
// repo's devEngines makes plain `npm pack` (which `attw --pack` uses) fail.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const bin = (name) => join("node_modules", ".bin", name);
const dir = mkdtempSync(join(tmpdir(), "onboarder-pack-"));

try {
  execFileSync("pnpm", ["pack", "--pack-destination", dir], {
    stdio: "inherit",
  });
  const tarball = join(
    dir,
    readdirSync(dir).find((file) => file.endsWith(".tgz")),
  );
  execFileSync(bin("publint"), [tarball], { stdio: "inherit" });
  // tailwind.css is a plain stylesheet export; attw only understands JS/types entry points.
  execFileSync(
    bin("attw"),
    [tarball, "--exclude-entrypoints", "./tailwind.css"],
    {
      stdio: "inherit",
    },
  );
} finally {
  rmSync(dir, { recursive: true, force: true });
}
