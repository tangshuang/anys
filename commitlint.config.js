module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'header-max-length': [2, 'always', 120],
        'subject-case': [2, 'always', [
            'lower-case',
            'upper-case',
            'camel-case',
            'kebab-case',
            'pascal-case',
            'sentence-case',
        ]],
        'scope-case': [2, 'always', [
            'lower-case',
            'pascal-case',
            'sentence-case',
        ]],
    },
};
