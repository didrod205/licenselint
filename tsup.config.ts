import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/cli.ts"],
  format: ["esm", "cjs"],
  dts: { entry: "src/index.ts" },
  clean: true,
  minify: false,
  treeshake: true,
  sourcemap: true,
  target: "es2022",
  shims: true,
});
