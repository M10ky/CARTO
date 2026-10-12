import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empêche Turbopack de remonter au-dessus du dépôt (il existe un
  // package.json orphelin dans le répertoire home qui déclenche un warning).
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    serverActions: {
      // Les fichiers d'import (Excel/CSV) dépassent la limite par défaut (1 Mo).
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
