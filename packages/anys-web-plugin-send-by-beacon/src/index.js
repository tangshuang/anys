import { replaceUrlSearch } from 'anys-shared';

export class AnysSendByBeaconPlugin {
    constructor(anys) {
        this.anys = anys;
    }

    options() {
        return {
            reportUrl: new Error('[Anys]: options.reportUrl is required!'),
            reportParams: null,
        };
    }

    async send(logs) {
        const { reportUrl, reportParams } = this.anys.options;
        const url = reportParams ? replaceUrlSearch(reportUrl, reportParams) : reportUrl;
        try {
            navigator.sendBeacon(url, JSON.stringify(logs));
        }
        catch (e) {
            console.error(e);
        }
    }

    auth(info) {
        this.anys.options.reportParams = Object.assign(this.anys.options.reportParams || {}, info);
    }
}
