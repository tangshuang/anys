import { AnysPlugin, camelCase, Evt } from 'anys-shared';
import { createRandomString } from 'ts-fns';

/**
 * @type PerformanceNavigationTiming
 */
// @ts-ignore
const navigation = performance.getEntriesByType('navigation')[0];
const {
    name: url,
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
const { timeOrigin } = performance;

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
 * <div is="anys-perf"></div>
 */
customElements.define('anys-perf', AnysPerfElement, { extends: 'div' });

export class AnysMonitorPerformancePlugin extends AnysPlugin {
    hasReported = 0;

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
    init() {
        if (this.anys.options.performance && !this.hasReported) {
            const log = {
                type: 'performance.navigation',
                time: Date.now(),
                detail: {
                    url,
                    redirectCount,
                    type,
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
                },
            };
            this.anys.write(log);
            this.hasReported = 1;
        }
    }

    /**
     * @private
     */
    registerPerformance() {
        const listen = (log) => {
            this.anys.write(log);
        };
        evt.on('perf', listen);

        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                const { name, startTime, duration } = entry;
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

        return () => {
            evt.off('perf', listen);
            observer.disconnect();
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
