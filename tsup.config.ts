import { defineConfig } from "tsup";

export default defineConfig({
  // `index` is the client bundle; `target` is a tiny server-safe entry
  // (no "use client") so Server Components can spread typed target props.
  entry: { index: "src/index.ts", target: "src/target.ts" },
  format: ["esm", "cjs"],
  // tsup's declaration bundler needs the JS compiler API (TypeScript <= 6) and
  // injects `baseUrl`, which TS 6 flags as deprecated. Silence that here so
  // tsconfig.json stays clean.
  dts: { compilerOptions: { ignoreDeprecations: "6.0" } },
  clean: true,
  sourcemap: true,
  treeshake: true,
  target: "es2020",
  // The "use client" directive is added to dist/index.* only (see the script),
  // so it can't leak onto the server-safe `target` entry. react, react-dom,
  // framer-motion, @floating-ui/react and tailwind-merge are externalized
  // automatically from package.json.
  onSuccess: "node scripts/add-use-client.mjs",
});
