import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
    },
    env: {
      node: true,
      jest: true,
    },
  },
  {
    files: ["*.cjs", "*.config.cjs", "*.config.js"],
    languageOptions: {
      sourceType: "script",
      ecmaVersion: 2022,
      globals: {
        module: "writable",
        require: "writable",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    env: { node: true },
  },
];
