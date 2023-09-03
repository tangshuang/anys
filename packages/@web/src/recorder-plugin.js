import { AnysPlugin, ajaxPost, replaceUrlSearch } from 'anys-shared';
import { AnysMonitorAjaxPlugin } from 'anys-web-plugin-monitor-ajax';
import { AnysIdentifyPlugin } from 'anys-web-plugin-identify';
import { AnysMonitorInputEventPlugin } from 'anys-web-plugin-monitor-input-event';
import { AnysMonitorMouseEventPlugin } from 'anys-web-plugin-monitor-mouse-event';
import { AnysMonitorWindowActivityPlugin } from 'anys-web-plugin-monitor-window-activity';
import { AnysMonitorUrlPlugin } from 'anys-web-plugin-monitor-url';
import { AnysMonitorTouchEventPlugin } from 'anys-web-plugin-monitor-touch-event';
import { AnysStoreOfflinePlugin } from 'anys-web-plugin-store-offline';
import { AnysMonitorDOMMutationPlugin } from 'anys-web-plugin-monitor-dom-mutation';
import { AnysMonitorWindowSizePlugin } from 'anys-web-plugin-monitor-window-size';
import { AnysMonitorScrollEventPlugin } from 'anys-web-plugin-monitor-scroll-event';

export class AnysRecorderPlugin extends AnysPlugin {
    static dependencies = [
        AnysStoreOfflinePlugin,
        AnysMonitorUrlPlugin,
        AnysMonitorWindowSizePlugin,
        AnysMonitorDOMMutationPlugin,
        AnysIdentifyPlugin,
        AnysMonitorAjaxPlugin,
        AnysMonitorInputEventPlugin,
        AnysMonitorMouseEventPlugin,
        AnysMonitorWindowActivityPlugin,
        AnysMonitorTouchEventPlugin,
        AnysMonitorScrollEventPlugin,
    ];

    constructor(anys, [offlineStore, urlMonitor, windowSizeMonitor, DOMMutationMonitor]) {
        super(anys);
        this.offlineStore = offlineStore;
        this.urlMonitor = urlMonitor;
        this.windowSizeMonitor = windowSizeMonitor;
        this.DOMMutationMonitor = DOMMutationMonitor;
        // cache for trace logs to be send by beacon
        this.cache = {};
    }

    options() {
        const isSupportTouch = 'ontouchend' in document;
        return {
            touch: isSupportTouch,
            mouse: !isSupportTouch,
            click: false,
            mousedown: true,
            mousemove: true,
            mouseup: true,
            autoReport: false,
            reportUrl: new Error('[Anys]: options.reportUrl is required!'),
            reportInterval: 10000,
            reportParams: null,
        };
    }

    registerAutoReport() {
        const { clientId } = this.anys;
        const autoReportWhenRefreshTraceId = ({ prev }) => {
            // report previous trace logs
            this.anys.report([
                { key: 'client', value: clientId },
                { key: 'trace', value: prev },
            ]);

            // clear cache
            this.cache = {};

            // record new information
            this.urlMonitor.recordUrl();
            this.windowSizeMonitor.recordSize();
            this.DOMMutationMonitor.recordSnapshot();
        };
        this.anys.on('refreshTraceId', autoReportWhenRefreshTraceId);

        const timer = setInterval(() => {
            this.anys.report();
        }, this.anys.options.reportInterval);

        let isUnloaded = 0;
        const sendBeaconWhenBeforeUnload = () => {
            if (isUnloaded) {
                return;
            }
            isUnloaded = 1;

            const ids = Object.keys(this.cache);
            const logs = Object.values(this.cache);
            if (ids.length) {
                this.offlineStore.remove(ids); // async may not executed
                navigator.sendBeacon(this.anys.options.reportUrl, JSON.stringify(logs));
                this.cache = {};
            }
        };
        window.addEventListener('beforeunload', sendBeaconWhenBeforeUnload);
        window.addEventListener('pagehide', sendBeaconWhenBeforeUnload); // 兼容微信浏览器
        window.addEventListener('unload', sendBeaconWhenBeforeUnload);

        const addCacheWhenWriteLog = ({ id, data }) => {
            this.cache[id] = data;
        };
        this.anys.on('writeOfflineLog', addCacheWhenWriteLog);

        return () => {
            this.anys.off('refreshTraceId', autoReportWhenRefreshTraceId);
            this.anys.off('writeOfflineLog', addCacheWhenWriteLog);
            // @ts-ignore
            clearInterval(timer);
            window.removeEventListener('beforeunload', sendBeaconWhenBeforeUnload);
        };
    }

    /**
     * define read here, so that recorder will not send other plugins 'read' output
     * @param {*} message
     * @returns
     */
    read(message) {
        return this.offlineStore.read(message);
    }

    send(logs) {
        const groups = [];
        let i = 0;

        logs.forEach((item) => {
            groups[i] = groups[i] || [];
            groups[i].push(item);
            if (groups[i].length > 200) {
                i ++;
            }
        });

        const defers = groups.map((data) => {
            const items = [];
            const ids = [];

            data.forEach((item) => {
                const { _id, ...info } = item;
                ids.push(_id);
                items.push(info);
            });

            if (!items.length) {
                return;
            }

            const { reportUrl, reportParams } = this.anys.options;
            const url = reportParams ? replaceUrlSearch(reportUrl, reportParams) : reportUrl;
            return ajaxPost(url, items).then(() => {
                ids.forEach((id) => {
                    delete this.cache[id];
                });
            });
        });

        return Promise.all(defers);
    }

    clear() {
        this.cache = {};
    }
}
