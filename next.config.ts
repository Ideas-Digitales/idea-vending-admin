const nextConfig = {
  // Suprimir warnings de hidratación causados por extensiones del navegador
  reactStrictMode: true,
  experimental: {
    // Ayuda con problemas de hidratación
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
