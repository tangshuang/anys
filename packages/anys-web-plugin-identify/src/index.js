import { createRandomString } from 'ts-fns';

export class AnysIdentifyPlugin {
    constructor(anys) {
        this.anys = anys;
    }

    options() {
        return {
            namespace: new Error('options.namespace is required!'),
        };
    }

    defines() {
        const defineClientId = () => {
            const { namespace } = this.anys.options;
            const key = `Anys.${namespace}.clientId`;
            let clientId = localStorage.getItem(key);
            if (!clientId) {
                clientId = createRandomString(8);
                localStorage.setItem(key, clientId);
            }
            return clientId;
        };

        const defineTraceId = () => {
            const { namespace } = this.anys.options;
            const key = `Anys.${namespace}.traceId`;
            let traceId = sessionStorage.getItem(key);
            if (!traceId) {
                traceId = createRandomString(8);
                sessionStorage.setItem(key, traceId);
            }
            return traceId;
        }

        return {
            client: defineClientId,
            trace: defineTraceId,
        };
    }

    refreshTraceId() {
        const { namespace } = this.anys.options;
        const key = `Anys.${namespace}.traceId`;
        const traceId = createRandomString(8);
        sessionStorage.setItem(key, traceId);
    }
}
