
export default {
    entry: 'dist/index.js',
    dest: 'dist/bundles/OAI-codegen.umd.js',
    format: 'umd',
    moduleName: 'OAI_codegen',
    external: [ "oai-ts-core" ],
    globals: {
        "oai-ts-core": "OAI"
    }
};
