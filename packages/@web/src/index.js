import { Anys } from 'anys';
import { AnysRecorderPlugin } from './recorder-plugin.js';

export const create = (options = {}) => new Anys({
    plugins: {
        recorder: AnysRecorderPlugin,
    },
    namespace: 'AnysTracer',
    autoReport: false,
    ...options,
});
