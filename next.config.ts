import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suprimir warnings de hidratación causados por extensiones del navegador
  reactStrictMode: true,
  experimental: {
    // Ayuda con problemas de hidratación
    optimizePackageImports: ['lucide-react'],
  },
  // Configuración para manejar atributos de extensiones del navegador
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // En desarrollo, ignorar ciertos warnings de hidratación
      config.resolve.alias = {
        ...config.resolve.alias,
      };
    }
    return config;
  },
};

export default nextConfig;
