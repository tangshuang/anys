/* eslint-disable no-underscore-dangle */

import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    target: ['web', 'es5'],
    mode: 'production',
    devtool: 'source-map',
    entry: path.resolve(process.cwd(), 'src/index.js'),
    output: {
        path: path.resolve(process.cwd(), 'dist'),
        filename: 'index.js',
        library: {
            type: 'assign-properties',
            name: 'anys',
        },
    },
    resolve: {
        alias: {
            'ts-fns$': path.resolve(__dirname, 'node_modules/ts-fns/es/index.js'),
            '@babel/runtime/helpers': path.resolve(__dirname, 'node_modules/@babel/runtime/helpers'),
        },
        symlinks: true,
        modules: [
            'node_modules',
            path.resolve(__dirname, 'node_modules'),
        ],
        conditionNames: [
            'browser',
            'require',
            'import',
        ],
    },
    optimization: {
        minimize: true,
        usedExports: true,
        sideEffects: true,
        concatenateModules: true,
        minimizer: [
            new TerserPlugin({ parallel: true }),
        ],
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
            },
        ],
    },
};
