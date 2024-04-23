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
                    level: 590,
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
                this.anys.send(log);
            } else if (target instanceof HTMLElement) {
                const log = {
                    type: 'DownloadError',
                    level: 589,
                    time: Date.now(),
                    name: target.tagName,
                    detail: {
                        e: getPath(target),
                    },
                };
                this.anys.send(log);
            }
        };
        window.addEventListener('error', listener, true);
        return () => window.removeEventListener('error', listener);
    }

    registerUnhandledrejection() {
        const listener = (e) => {
            const { reason } = e;
            if (typeof reason === 'string') {
                const log = {
                    type: 'PromiseRejection',
                    level: 585,
                    time: Date.now(),
                    detail: { message: reason },
                };
                this.anys.write(log);
            } else if (reason && reason instanceof Error) {
                const { name, message } = reason;
                const log = {
                    type: 'PromiseRejection',
                    level: 585,
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
