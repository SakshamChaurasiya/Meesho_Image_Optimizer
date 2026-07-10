/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@imgly/background-removal-node", "onnxruntime-node"],
  },
};

export default nextConfig;
