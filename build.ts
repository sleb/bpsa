import tailwind from "bun-plugin-tailwind";
import { rm } from "node:fs/promises";
import path from "node:path";

const REQUIRED_ENV_VARS = [
  "BUN_PUBLIC_FIREBASE_API_KEY",
  "BUN_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "BUN_PUBLIC_FIREBASE_PROJECT_ID",
  "BUN_PUBLIC_FIREBASE_APP_ID",
  "BUN_PUBLIC_USE_EMULATOR",
];

export const build = async (): Promise<Bun.BuildOutput> => {
  if (process.env.NODE_ENV !== "production") {
    throw new Error("NODE_ENV must be set to 'production'");
  }

  REQUIRED_ENV_VARS.forEach((varName) => {
    if (!process.env[varName]) {
      throw new Error(`Required environment variable ${varName} is not set`);
    }
  });

  const outdir = path.join(process.cwd(), "dist");
  await rm(outdir, { recursive: true, force: true });

  const entrypoints = [...new Bun.Glob("src/**/*.html").scanSync()];

  return Bun.build({
    entrypoints,
    outdir,
    plugins: [tailwind],
    minify: true,
    target: "browser",
    sourcemap: "linked",
    env: "inline",
  });
};

const main = async () => {
  const result = await build();

  for (const output of result.outputs) {
    console.log(
      ` ${path.relative(process.cwd(), output.path)}  ${(output.size / 1024).toFixed(1)} KB`,
    );
  }
};

if (import.meta.main) {
  await main();
}
