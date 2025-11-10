import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";

export default [
    js.configs.recommended,
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
            },
            globals: {
                // Browser globals
                window: "readonly",
                document: "readonly",
                console: "readonly",
                setTimeout: "readonly",
                // Node.js globals
                process: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
                module: "readonly",
                require: "readonly",
                // Electron globals
                exports: "readonly",
            },
        },
        plugins: {
            "@typescript-eslint": tseslint,
            import: importPlugin,
        },
        rules: {
            ...tseslint.configs.recommended.rules,
            ...tseslint.configs["eslint-recommended"].overrides[0].rules,
            "@typescript-eslint/no-explicit-any": "warn",
            "import/no-named-as-default": "off",
            "prefer-const": "error",
            "no-case-declarations": "error",
        },
    },
    {
        ignores: [
            "node_modules/**",
            ".vite/**",
            "out/**",
            "dist/**",
            "*.config.ts",
            "*.config.js",
            "*.config.mjs",
        ],
    },
];
