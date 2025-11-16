import { Anys } from 'anys';
import { AnysOfflineTracerPlugin } from './offline-tracer-plugin.js';

export const createTracer = (options = {}) => new Anys({
    namespace: 'AnysTracer',
    ...options,
    plugins: {
        ...(options.plugins || {}),
        tracer: AnysOfflineTracerPlugin,
    },
});
