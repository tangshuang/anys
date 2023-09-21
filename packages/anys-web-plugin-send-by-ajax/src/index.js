import { ajaxPost, replaceUrlSearch, AnysPlugin } from 'anys-shared';

export class AnysSendByAjaxPlugin extends AnysPlugin {
    options() {
        return {
            autoReport: true,
            reportUrl: new Error('options.reportUrl is required!'),
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
            await ajaxPost(url, { data: logs });
        }
        catch (e) {
            console.error(e);
        }
    }
}
