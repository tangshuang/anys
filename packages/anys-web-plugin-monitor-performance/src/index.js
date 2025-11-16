import { AnysPlugin, camelCase, Evt } from 'anys-utils';
import { createRandomString } from 'ts-fns';

function getInitNavigationPerformanceData() {
    const { timeOrigin } = performance;
    try {
        /**
         * @type PerformanceNavigationTiming
         */
        // @ts-ignore
        const navigation = performance.getEntriesByType('navigation')[0];
        const {
            startTime,
            unloadEventStart,
            unloadEventEnd,
            redirectStart,
            redirectEnd,
            workerStart,
            fetchStart,
            domainLookupStart,
            domainLookupEnd,
            connectStart,
            secureConnectionStart,
            connectEnd,
            requestStart,
            responseStart,
            responseEnd,
            domInteractive,
            domContentLoadedEventStart,
            domContentLoadedEventEnd,
            domComplete,
            loadEventStart,
            loadEventEnd,
            redirectCount,
            type,
            decodedBodySize,
            encodedBodySize,
            transferSize,
            nextHopProtocol,
        } = navigation;

        // @ts-ignore
        const { firstPaint: FP, firstContentfulPaint: FCP } = [...performance.getEntriesByType('paint')].reduce((map, entry) => {
            map[camelCase(entry.name)] = entry.startTime;
            return map;
        }, {});

        const TCP = connectEnd - connectStart;
        const DNS = domainLookupEnd - domainLookupStart;
        const TLS = requestStart - secureConnectionStart;
        const REQUEST = responseStart - requestStart;
        const RESPONSE = responseEnd - responseStart;
        const REDIRECT = redirectEnd - redirectStart;
        const COMPRESSED = decodedBodySize !== encodedBodySize;
        const CACHED = !transferSize;
        const PROTOCOL = nextHopProtocol;
        const TTFB = responseStart - startTime;

        let LCP;
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if(!LCP) {
                    LCP = entry.startTime;
                }
            }
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        let TTI;
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if(!TTI) {
                    TTI = entry.startTime;
                }
            }
        }).observe({ entryTypes: ['longtask'] });

        const navigationData = {
            type,
            redirectCount,
            timeOrigin,

            startTime,
            unloadEventStart,
            unloadEventEnd,
            redirectStart,
            redirectEnd,
            workerStart,
            fetchStart,
            domainLookupStart,
            domainLookupEnd,
            connectStart,
            secureConnectionStart,
            connectEnd,
            requestStart,
            responseStart,
            responseEnd,
            domInteractive,
            domContentLoadedEventStart,
            domContentLoadedEventEnd,
            domComplete,
            loadEventStart,
            loadEventEnd,

            FP,
            FCP,
            TTFB,
            LCP,
            TTI,

            TCP,
            DNS,
            REQUEST,
            RESPONSE,
            REDIRECT,
            TLS,
            COMPRESSED,
            CACHED,
            PROTOCOL,
        };

        return navigationData;
    }
    catch (e) {
        console.log(e);
        return { timeOrigin };
    }
}

const navigationData = getInitNavigationPerformanceData();
const evt = new Evt();

const reportedMap = {};
class AnysPerfElement extends HTMLDivElement {
    connectedCallback() {
        const { dataset } = this;
        const { name, ...data } = dataset;
        if (!name) {
            return;
        }

        if (reportedMap[name]) {
            return;
        }

        const { timeOrigin, domInteractive } = navigationData;
        const now = performance.now();
        evt.emit('perf', {
            type: 'performance.dom',
            time: Date.now(),
            name,
            data,
            detail: {
                timeOrigin,
                startTime: domInteractive,
                duration: now - domInteractive,
            },
        });
        reportedMap[name] = 1;
    }
}

/**
 * @example
 * <div is="anys-perf" data-name="report-point-name"></div>
 * Notice: data-name is required
 */
customElements.define('anys-perf', AnysPerfElement, { extends: 'div' });

export class AnysMonitorPerformancePlugin extends AnysPlugin {
    hasNavigationReported = 0;

    /**
     * @private
     */
    options() {
        return {
            performance: true,
            fps: true,
        };
    }

    /**
     * @private
     */
    registerPerformance() {
        // report navigation when start, only once
        if (!this.hasNavigationReported) {
            const log = {
                type: 'performance.navigation',
                time: Date.now(),
                detail: {
                    url: window.location.href,
                    ...navigationData,
                },
            };
            this.anys.write(log);
            this.hasNavigationReported = 1;
        }

        const listen = (log) => {
            this.anys.write(log);
        };
        evt.on('perf', listen);

        let observer;
        try {
            observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    const { name, startTime, duration } = entry;
                    const { timeOrigin } = navigationData;
                    const log = {
                        type: 'performance.measure',
                        time: Date.now(),
                        name,
                        detail: {
                            timeOrigin,
                            startTime,
                            duration,
                        },
                    };
                    this.anys.write(log);
                });
            });
            observer.observe({ entryTypes: ['measure'] });
        }
        catch (e) {
            console.error(e);
        }

        return () => {
            evt.off('perf', listen);
            observer?.disconnect();
        };
    }

    /**
     * @private
     */
    registerFps() {
        const fpsOption = this.anys.options.fps;

        let request;

        let frameList = [performance.now()];

        const run = () => {
            const now = performance.now();
            frameList.push(now);

            const firstFrame = frameList[0];
            if (now - firstFrame >= 1000) {
                const fps = frameList.length;
                if (fps < (typeof fpsOption === 'number' ? fpsOption : 25)) {
                    const { timeOrigin } = navigationData;
                    const log = {
                        type: 'performance.fps',
                        time: Date.now(),
                        fps,
                        detail: {
                            timeOrigin,
                            startTime: firstFrame,
                            duration: now - firstFrame,
                        },
                    };
                    this.anys.write(log);
                }
                frameList = [now];
            }

            request = requestAnimationFrame(run);
        };
        request = requestAnimationFrame(run);

        return () => {
            cancelAnimationFrame(request);
        };
    }

    mark(name) {
        const id = name + createRandomString(8)
        performance.mark(id);
        return () => {
            performance.measure(name, id);
            performance.clearMeasures(name);
            performance.clearMarks(id);
        };
    }
}
