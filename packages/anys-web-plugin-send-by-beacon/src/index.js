import { replaceUrlSearch, AnysPlugin, ajaxPost } from 'anys-shared';

export class AnysSendByBeaconPlugin extends AnysPlugin {
    options() {
        return {
            autoReport: true,
            reportUrl: new Error('options.reportUrl is required!'),
            reportParams: null,
            reportInterval: 0,
            reportChunkCount: 200,
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

    arrange(_, logs) {
        const { reportChunkCount } = this.anys.options;
        const groups = [];
        let i = 0;

        logs.forEach((item) => {
            groups[i] = groups[i] || [];
            groups[i].push(item);
            if (groups[i].length > reportChunkCount) {
                i ++;
            }
        });

        return groups;
    }

    send(logs) {
        const { reportUrl, reportParams } = this.anys.options;
        const params = typeof reportParams === 'function' ? reportParams() : reportParams;
        const url = params ? replaceUrlSearch(reportUrl, params) : reportUrl;

        // sendBeacon is not supported
        if (typeof navigator?.sendBeacon === 'undefined') {
            ajaxPost(url, { data: logs });
            return;
        }

        navigator.sendBeacon(url, JSON.stringify({ data: logs, by: 'beacon' }));
    }
}
