import nextConfig from "eslint-config-next";

const config = [
  ...nextConfig,
  { ignores: [".source/", ".next/", "node_modules/"] },
];

export default config;
