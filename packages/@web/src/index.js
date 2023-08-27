import { Anys } from 'anys';
import { AnysRecorderPlugin } from './recorder-plugin.js';

export const create = (options = {}) => new Anys({
    namespace: 'AnysTracer',
    autoReport: false,
    ...options,
    plugins: {
        ...(options.plugins || {}),
        recorder: AnysRecorderPlugin,
    },
});
