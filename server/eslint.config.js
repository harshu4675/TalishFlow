import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/**", "uploads/**", "logs/**"] },
  {
    files: ["**/*.js"],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      // The legacy codebase contains intentionally dormant optional integrations.
      // Keep lint focused on correctness until those integrations are split out.
      "no-unused-vars": "off",
    },
  },
];
