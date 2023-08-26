import { toUrlParams } from 'anys-shared';

export class AnysSendByImgPlugin {
    constructor(anys) {
        this.anys = anys;
    }

    options() {
        return {
            reportUrl: new Error('[Anys]: options.reportUrl is required!'),
        };
    }

    send(logs) {
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
