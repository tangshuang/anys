import { Anys } from 'anys';
import { AnysRecorderPlugin } from './recorder-plugin.js';

class RecorderAnys extends Anys {
    /**
     * patch auth info into reportParams
     * @param {object} info
     */
    auth(info) {
        this.options.reportParams = Object.assign(this.options.reportParams || {}, info);
    }
}

export const create = (options = {}) => new RecorderAnys({
    namespace: 'AnysTracer',
    autoReport: false,
    ...options,
    plugins: {
        ...(options.plugins || {}),
        recorder: AnysRecorderPlugin,
    },
});
