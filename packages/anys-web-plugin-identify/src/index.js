import { createRandomString } from 'ts-fns';

export class AnysIdentifyPlugin {
    constructor(anys) {
        this.anys = anys;
    }

    options() {
        return {
            namespace: new Error('[Anys]: options.namespace is required!'),
        };
    }

    defines() {
        return {
            client: this.defineClientId.bind(this),
            trace: this.defineTraceId.bind(this),
        };
    }

    defineClientId() {
        const { namespace } = this.anys.options;
        const key = `Anys.${namespace}.clientId`;
        let clientId = localStorage.getItem(key);
        if (!clientId) {
            clientId = createRandomString(8);
            sessionStorage.setItem(key, clientId);
        }
        return clientId;
    }

    defineTraceId() {
        const { namespace } = this.anys.options;
        const key = `Anys.${namespace}.traceId`;
        const traceId = createRandomString(8);
        // update each time when invoke refreshTraceId
        sessionStorage.setItem(key, traceId);
        return traceId;
    }
}
