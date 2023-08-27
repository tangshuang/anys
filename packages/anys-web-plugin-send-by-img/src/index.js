import { toUrlParams, AnysPlugin } from 'anys-shared';

export class AnysSendByImgPlugin extends AnysPlugin {
    options() {
        return {
            autoReport: true,
            reportUrl: new Error('[Anys]: options.reportUrl is required!'),
        };
    }

    registerAutoReport() {
        const listener = () => {
            this.anys.report();
        }
        this.anys.on('write', listener);
        return () => this.anys.off('write', listener);
    }

    send(_, logs) {
        const { reportUrl } = this.anys.options;
        const preLen = reportUrl.length + 1; // `${reportUrl}?`
        logs.forEach((log) => {
            const params = toUrlParams(log, preLen);
            params.forEach((paramStr) => {
                const src = `${reportUrl}?${paramStr}`;
                new Image().src = src;
            });
        });
    }
}
