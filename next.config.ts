import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @formepdf/core ships a self-initializing WASM layout engine that reads its
  // own .wasm via node:fs at runtime. Keep it external so the bundler doesn't
  // try to process the wasm/CJS and the file resolves from node_modules.
  serverExternalPackages: ["@formepdf/core"],
};

export default nextConfig;
