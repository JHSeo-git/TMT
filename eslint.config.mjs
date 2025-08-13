import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"
import js from "@eslint/js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  {
    ignores: ["node_modules/", ".next/", "dist/", "build/", "public/"],
  },

  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),

  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
]

export default eslintConfig
