import nextConfig from "eslint-config-next";

const eslintConfig = [
  {
    ignores: [
      "design/**",
      ".next/**",
      "node_modules/**",
      "dist/**",
      "build/**",
    ],
  },
  ...nextConfig,
];

export default eslintConfig;
