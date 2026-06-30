import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep both formepdf packages external (unbundled), for two reasons:
  // 1. @formepdf/core ships a self-initializing WASM layout engine that reads
  //    its own .wasm via node:fs — bundling breaks that file resolution.
  // 2. @formepdf/core serializes a document by reference-comparing element
  //    types against @formepdf/react's components (`child.type === Page`). If
  //    Next bundles @formepdf/react, our JSX uses a *different* copy than the
  //    one core imports from node_modules, so no components match and every
  //    page is dropped (empty 0-page PDF). Both external => one shared copy.
  serverExternalPackages: ["@formepdf/core", "@formepdf/react"],
};

export default nextConfig;
