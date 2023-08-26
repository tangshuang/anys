import { AnysPlugin, getPath } from 'anys-shared';

export class AnysMonitorErrorPlugin extends AnysPlugin {
    options() {
        return {
            error: true,
            unhandledrejection: true,
        };
    }

    registerError() {
        const listener = (e) => {
            if (!(e instanceof ErrorEvent)) {
                return;
            }

            const {
                colno, filename, lineno, message, error, target,
            } = e;

            if (target === window) {
                const { name, stack } = error || {};
                const log = {
                    type: 'JSError',
                    time: Date.now(),
                    msg: message,
                    name,
                    detail: {
                        stack,
                        filename,
                        colno,
                        lineno,
                    },
                };
                this.anys.write(log);
            } else if (target instanceof HTMLElement) {
                const log = {
                    type: 'DownloadError',
                    time: Date.now(),
                    name: target.tagName,
                    detail: {
                        e: getPath(target),
                    },
                };
                this.anys.write(log);
            }
        };
        const type = 'error';
        window.addEventListener(type, listener, true);
        return () => window.removeEventListener(type, listener);
    }

    registerUnhandledrejection() {
        const listener = (e) => {
            const { reason } = e;
            if (typeof reason === 'string') {
                const log = {
                    type: 'PromiseRejection',
                    time: Date.now(),
                    detail: { message: reason },
                };
                this.anys.write(log);
            } else if (reason && reason instanceof Error) {
                const { name, message } = reason;
                const log = {
                    type: 'PromiseRejection',
                    time: Date.now(),
                    name,
                    detail: { message },
                };
                this.anys.write(log);
            }
        };
        window.addEventListener('unhandledrejection', listener, true);
        return () => window.removeEventListener('unhandledrejection', listener);
    }
}
