export default {
    assumptions: {
        setPublicClassFields: true,
        privateFieldsAsSymbols: true,
        constantSuper: true,
        noClassCalls: true,
        setClassMethods: true,
        superIsCallableConstructor: true,
    },
    presets: [
        '@babel/preset-env',
    ],
    targets: 'ie 9',
    babelrcRoots: [
        '.',
        './packages/*',
    ],
};
