export default {
    targets: 'node 16',
    assumptions: {
        setPublicClassFields: true,
        privateFieldsAsSymbols: true,
        constantSuper: true,
        noClassCalls: true,
        setClassMethods: true,
        superIsCallableConstructor: true,
    },
    plugins: [
        '@babel/plugin-transform-modules-commonjs',
        ['@babel/plugin-transform-class-properties', { loose: true }],
        ['@babel/plugin-transform-classes', { loose: true }],
        // if want more compilantable, open the following rules
        '@babel/plugin-transform-object-rest-spread',
        '@babel/plugin-transform-spread',
        '@babel/plugin-transform-template-literals',
        '@babel/plugin-transform-arrow-functions',
        '@babel/plugin-transform-parameters',
    ],
    babelrcRoots: [
        '.',
        './packages/*',
    ],
};
