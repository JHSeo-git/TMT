import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import prettier from "eslint-config-prettier/flat"
import { defineConfig, globalIgnores } from "eslint/config"
import tseslint from "typescript-eslint"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  tseslint.configs.recommended,
  prettier,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
  },
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  globalIgnores(["node_modules/", ".next/", "dist/", "build/", "public/"]),
])

// /** @type {import('eslint').Linter.Config[]} */
// const eslintConfigLegacy = [
//   {
//     ignores: ["node_modules/", ".next/", "dist/", "build/", "public/"],
//   },

//   ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),

//   {
//     rules: {
//       "@next/next/no-html-link-for-pages": "off",
//       "@typescript-eslint/no-empty-object-type": "warn",
//       "@typescript-eslint/no-unused-vars": "warn",
//     },
//   },
// ]

export default eslintConfig
