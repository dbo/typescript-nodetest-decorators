/** @type {import("prettier").Config} */
export default {
    useTabs: false,
    tabWidth: 4,
    printWidth: 100,
    semi: true,
    singleQuote: false,
    jsxSingleQuote: false,
    jsxBracketSameLine: false,
    quoteProps: "consistent",
    trailingComma: "all",
    bracketSpacing: true,
    bracketSameLine: false,
    arrowParens: "always",

    overrides: [
        {
            files: ["*.css", "*.less", "*.sass", "*.scss", "*.json*"],
            excludeFiles: ["package.json", "tsconfig.json"],
            options: {
                tabWidth: 2,
            },
        },
    ],
};
