module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: 'airbnb-base',
    overrides: [],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    rules: {
        indent: ['error', 4],
        semi: ['error', 'always'],
        'import/no-extraneous-dependencies': [0],
        'class-methods-use-this': [0],
        'import/prefer-default-export': [0],
        'import/no-unresolved': [0],
        'import/extensions': ['error', 'ignorePackages'],
        'no-continue': [0],
        'consistent-return': [0],
    },
};
