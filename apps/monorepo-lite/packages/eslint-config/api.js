import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

import { config as baseConfig } from "./base.js";

/**
 * ESLint configuration for Hono API projects.
 *
 * @type {import("eslint").Linter.Config}
 */
export const apiConfig = [
  ...baseConfig,
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    rules: {
      // import/order rule for API projects
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling", "index"],
            "object",
            "type",
          ],
          pathGroups: [
            {
              pattern: "@libs/**",
              group: "internal",
              position: "after",
            },
            {
              pattern: "@contracts/**",
              group: "internal",
              position: "after",
            },
            {
              pattern: "@schemas/**",
              group: "internal",
              position: "after",
            },
            {
              pattern: "@generated/**",
              group: "internal",
              position: "after",
            },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
          "newlines-between": "always",
        },
      ],
    },
  },
];
