import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits a self-contained .next/standalone build (only the files actually
  // needed at runtime) — keeps inode/file-count usage low on shared cPanel
  // hosting, and is what the root server.js shim expects to find.
  output: "standalone",
  // @react-pdf/renderer reads the yoga-layout WASM binary and pdfkit's
  // standard-font .afm metric files at runtime via fs/path strings, which
  // Next's default trace misses in standalone output — without them the
  // quotation PDF route 500s with "Failed to generate PDF." on cPanel.
  outputFileTracingIncludes: {
    "/api/quotations/[id]/pdf": [
      "./node_modules/yoga-layout/dist/binaries/**/*",
      "./node_modules/pdfkit/js/data/**/*",
      "./node_modules/@react-pdf/**/*",
    ],
  },
  experimental: {
    // Shared cPanel hosting caps the number of processes a single account
    // can spawn — Next.js's default multi-worker static-page generation
    // spawns several child Node processes and hits that limit (EAGAIN).
    // Force a single worker so the build never spawns more than one.
    cpus: 1,
  },
};

export default nextConfig;
