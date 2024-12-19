/**
 * @link https://prettier.io/docs/en/options
 */
const config = {
    arrowParens: "always",
    bracketSameLine: true,
    endOfLine: "lf",
    embeddedLanguageFormatting: "auto",
    htmlWhitespaceSensitivity: "ignore",
    jsxSingleQuote: false,
    // parser: "typescript",
    proseWrap: "preserve",
    printWidth: Infinity,
    trailingComma: "es5",
    semi: true,
    singleAttributePerLine: false,
    singleQuote: false,
    vueIndentScriptAndStyle: false,

    bracketSameLine: false,
    bracketSpacing: true,

    rangeStart: 0,
    rangeEnd: Infinity,

    tabWidth: 4,
    useTabs: false,

    requirePragma: false,
    insertPragma: false
};

module.exports = config;