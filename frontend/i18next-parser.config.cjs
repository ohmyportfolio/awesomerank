module.exports = {
    defaultNamespace: 'translation',
    lexers: {
        ts: ['JavascriptLexer'],
        tsx: ['JsxLexer'],
        js: ['JavascriptLexer'],
        jsx: ['JsxLexer'],
        default: ['JavascriptLexer'],
    },
    locales: ['en', 'ko', 'es', 'pt', 'zh', 'ja', 'fr', 'de', 'it', 'ru', 'hi', 'ar', 'id', 'tr'],
    output: 'src/locales/$LOCALE.json',
    input: ['src/**/*.{ts,tsx}'],
    sort: true,
    useKeysAsDefaultValue: true, // This is key for "Natural Language Keys"
    verbose: true,
    createOldCatalogs: false,
};
