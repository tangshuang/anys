import { Anys } from 'anys';
import { AnysRecorderPlugin } from './recorder-plugin.js';

const { currentScript } = document;

export const create = (options = {}) => new Anys({
    plugins: {
        recorder: AnysRecorderPlugin,
    },
    namespace: 'AnysTracer',
    autoReport: false,
    ...options,
});

// remove current script, so that we will not collect it in snapshot
currentScript.parentNode.removeChild(currentScript);
