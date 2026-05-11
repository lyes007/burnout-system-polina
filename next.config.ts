import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude onnxruntime-node from server-side bundling
  serverExternalPackages: ['onnxruntime-node'],
  
  webpack: (config, { isServer }) => {
    // Exclude onnxruntime-node from client-side bundling
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'onnxruntime-node': false,
      };
    }
    
    // Ignore .node files
    config.module.rules.push({
      test: /\.node$/,
      use: 'null-loader',
    });
    
    return config;
  },
};

export default nextConfig;
