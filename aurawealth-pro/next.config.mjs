/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Exportación estática: la app es 100% local-first (sin servidor). `npm run build`
  // genera /out, desplegable en cualquier hosting estático o abrible con `npx serve out`.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
