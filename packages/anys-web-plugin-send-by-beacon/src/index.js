import { replaceUrlSearch, AnysPlugin } from 'anys-shared';

export class AnysSendByBeaconPlugin extends AnysPlugin {
    options() {
        return {
            autoReport: true,
            reportUrl: new Error('[Anys]: options.reportUrl is required!'),
            reportParams: null,
            reportInterval: 0,
        };
    }

    registerAutoReport() {
        const { reportInterval } = this.anys.options;
        if (reportInterval) {
            const timer = setInterval(() => this.anys.report(), reportInterval);
            // @ts-ignore
            return () => clearInterval(timer);
        }

        const listener = () => this.anys.report();
        this.anys.on('write', listener);
        return () => this.anys.off('write', listener);
    }

    async send(_, logs) {
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
