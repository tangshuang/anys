import { Evt, AnysPlugin, replaceUrlSearch } from 'anys-utils';
import { createRandomString } from 'ts-fns';

const evt = new Evt();

function overwriteXHR() {
    const OXHR = window.XMLHttpRequest;
    // @ts-ignore
    // eslint-disable-next-line no-underscore-dangle
    window.__XMLHttpRequest = OXHR;
    // @ts-ignore
    // eslint-disable-next-line func-names
    window.XMLHttpRequest = function () {
        const xhr = new OXHR();
        const overmap = {
            open: xhr.open,
            send: xhr.send,
        };
        const info = {
            name: createRandomString(4),
        };

        const recordSend = () => {
            const {
                name, url, method, async, body,
            } = info;
            evt.emit('xhr', {
                type: 'xhr.req',
                time: Date.now(),
                name: `xhr_${name}`,
                url,
                detail: {
                    method,
                    async,
                    body,
                },
            });
        };

        const recordData = (type) => {
            const {
                name, url, method,
            } = info;

            let response;
            let responseType;
            if (!xhr.responseType || xhr.responseType === 'text') {
                response = xhr.responseText.toString();
                responseType = 'text';
            } else if (xhr.responseType === 'json') {
                response = xhr.response;
                responseType = 'json';
            }

            // other type are not allowed
            evt.emit('xhr', {
                type,
                time: Date.now(),
                name: `xhr_${name}`,
                url,
                detail: {
                    status: xhr.status,
                    method,
                    responseType,
                    response: response || undefined,
                },
            });
        };

        const recordResponse = () => {
            if (xhr.readyState !== 4) {
                return;
            }
            if (Math.floor(xhr.status / 100) === 2) {
                recordData('xhr.ok');
            } else {
                recordData('xhr.fail');
            }
        };

        const recordError = () => {
            recordData('xhr.err');
        };

        Object.defineProperty(xhr, 'open', {
            get: () => (method, url, async = true, ...args) => {
                const request = { method, url };
                evt.emit('request', request);
                Object.assign(info, { ...request, async });
                if (xhr.onreadystatechange) {
                    overmap.onreadystatechange = xhr.onreadystatechange;
                }
                const { open } = overmap;
                return open.call(xhr, request.method, request.url, async, ...args);
            },
            configurable: true,
        });

        Object.defineProperty(xhr, 'send', {
            get: () => (body) => {
                const { send } = overmap;
                const { async } = info;
                Object.assign(info, { body });
                recordSend();
                const res = send.call(xhr, body);
                if (!async) {
                    recordResponse();
                }
                return res;
            },
            configurable: true,
        });

        xhr.addEventListener('error', () => {
            recordError();
        });

        xhr.addEventListener('readystatechange', (e) => {
            // readystatechange event only triggered in async mode,
            // so we do not need to check whether in async mode
            recordResponse();
        });

        return xhr;
    };

    const recover = () => {
        // @ts-ignore
        // eslint-disable-next-line no-underscore-dangle
        window.XMLHttpRequest = window.__XMLHttpRequest;
    };

    return recover;
}

function overwriteFetch() {
    const ofetch = window.fetch;
    // @ts-ignore
    // eslint-disable-next-line no-underscore-dangle
    window.__fetch = ofetch;
    // @ts-ignore
    // eslint-disable-next-line func-names
    window.fetch = function (url, config = {}) {
        const { method, body } = config;
        const name = createRandomString(4);
        evt.emit('fetch', {
            type: 'fetch.init',
            time: Date.now(),
            name: `fetch_${name}`,
            url,
            detail: { body, method },
        });

        const request = { method, url };
        evt.emit('request', request);

        return Promise.resolve().then(() => ofetch(request.url, config)).then((res) => {
            const { status } = res;
            if (Math.floor(status / 100) === 2) {
                return new Proxy(res, {
                    get(_, key) {
                        if (key === 'json' || key === 'text') {
                            return () => res[key]().then((data) => {
                                evt.emit('fetch', {
                                    type: 'fetch.ok',
                                    time: Date.now(),
                                    name: `fetch_${name}`,
                                    url,
                                    detail: {
                                        status,
                                        data,
                                        method,
                                    },
                                });
                                return data;
                            });
                        }
                        return typeof res[key] === 'function' ? res[key].bind(res) : res[key];
                    },
                });
            }

            evt.emit('fetch', {
                type: 'fetch.fail',
                time: Date.now(),
                name: `fetch_${name}`,
                url,
                detail: {
                    status,
                    method,
                },
            });
            return res;
        }, (err) => {
            let detail;
            if (err instanceof Error) {
                const { name: type, message } = err;
                detail = {
                    method,
                    type,
                    err: message,
                };
            } else {
                detail = {
                    method,
                    err,
                };
            }
            evt.emit('fetch', {
                type: 'fetch.err',
                time: Date.now(),
                name: `fetch_${name}`,
                url,
                detail,
            });
        });
    };

    const recover = () => {
        // @ts-ignore
        // eslint-disable-next-line func-names
        window.fetch = window.__fetch;
    };

    return recover;
}

export class AnysMonitorAjaxPlugin extends AnysPlugin {
    options() {
        return {
            xhr: true,
            fetch: true,
            ajaxResponse: true,
            patchRequestId: true,
        };
    }

    registerXhr() {
        const recover = overwriteXHR();
        const listener = (log) => {
            if (!this.anys.options.ajaxResponse && log.type === 'xhr.ok') {
                delete log.detail.response;
            }
            this.anys.write(log);
        };
        evt.on('xhr', listener);
        return () => {
            evt.off('xhr', listener);
            recover();
        };
    }

    registerFetch() {
        const recover = overwriteFetch();
        const listener = (log) => {
            if (!this.anys.options.ajaxResponse && log.type === 'fetch.ok') {
                delete log.detail.data;
            }
            this.anys.write(log);
        };
        evt.on('fetch', listener);
        return () => {
            evt.off('fetch', listener);
            recover();
        };
    }

    registerPatchRequestId() {
        const listener = (info) => {
            const { url } = info;
            const { traceId, requestId } = this.anys;
            const newUrl = replaceUrlSearch(url, { _request_id: traceId + requestId });
            info.url = newUrl;
        }
        evt.on('request', listener);
        return () => evt.off('request', listener);
    }
}
