/** @type {import("@typescript-eslint/utils").TSESLint.Linter.Config} */
module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "eslint-plugin-import"],
  rules: {
    "import/order": ["error", { alphabetize: { order: "asc" } }],
    "sort-imports": ["error", { ignoreDeclarationSort: true }],
  },
  ignorePatterns: ["build", "dist", ".vercel"],
};
