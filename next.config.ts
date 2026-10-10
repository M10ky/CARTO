import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empêche Turbopack de remonter au-dessus du dépôt (il existe un
  // package.json orphelin dans le répertoire home qui déclenche un warning).
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
