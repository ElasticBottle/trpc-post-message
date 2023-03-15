import { defineConfig } from "tsup";

export default defineConfig((options) => {
  return {
    entry: ["src/link/index.ts", "src/adapter/index.ts", "src/types/index.ts"],
    splitting: false,
    sourcemap: true,
    clean: true,
    dts: true,
    format: ["cjs", "esm"],
    minify: !options.watch,
  };
});
