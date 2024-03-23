import { ajaxPost, replaceUrlSearch, AnysPlugin } from 'anys-shared';

export class AnysSendByAjaxPlugin extends AnysPlugin {
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

    async send(logs) {
        const { reportUrl, reportParams } = this.anys.options;
        const params = typeof reportParams === 'function' ? reportParams() : reportParams;
        const url = reportParams ? replaceUrlSearch(reportUrl, params) : reportUrl;
        try {
            await ajaxPost(url, { data: logs });
        }
        catch (e) {
            console.error(e);
        }
    }
}
