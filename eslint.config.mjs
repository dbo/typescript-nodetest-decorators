import { includeIgnoreFile } from "@eslint/compat";
import eslint from "@eslint/js";
import eslint_config_prettier from "eslint-config-prettier";
import globals from "globals";
import { join } from "node:path";
import ts_eslint from "typescript-eslint";

const gitignorePath = join(import.meta.dirname, ".gitignore");

export default ts_eslint.config(
    includeIgnoreFile(gitignorePath),
    eslint.configs.recommended,
    ...ts_eslint.configs.recommended,
    {
        files: ["**/*.{js,mjs,cjs,ts}"],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        rules: {
            "prefer-const": [
                "error",
                {
                    destructuring: "all",
                },
            ],
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-empty-object-type": "off",
        },
    },
    eslint_config_prettier,
);
