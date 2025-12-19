module.exports = {
    defaultNamespace: 'translation',
    keySeparator: false,
    namespaceSeparator: false,
    lexers: {
        ts: ['JavascriptLexer'],
        tsx: ['JsxLexer'],
        js: ['JavascriptLexer'],
        jsx: ['JsxLexer'],
        default: ['JavascriptLexer'],
    },
    locales: ['en', 'ko', 'es', 'pt', 'zh', 'ja', 'fr', 'de', 'it', 'ru', 'hi', 'ar', 'id', 'tr', 'th', 'vi', 'ms', 'fil', 'pl', 'nl', 'cs', 'sk', 'hu', 'el', 'da', 'no', 'sv', 'fi', 'is', 'et', 'lv', 'lt', 'sl', 'he'],
    output: 'src/locales/$LOCALE.json',
    input: ['src/**/*.{ts,tsx}'],
    sort: true,
    useKeysAsDefaultValue: true, // This is key for "Natural Language Keys"
    verbose: true,
    createOldCatalogs: false,
    keepRemoved: true, // 기존 번역을 삭제하지 않음 (질문 번역 등 동적 키 보존)
};
