import { AnysPlugin } from 'anys-shared';

export class AnysMonitorUrlPlugin extends AnysPlugin {
    options() {
        return {
            url: true,
        };
    }

    registerUrl() {
        const listener = () => {
            this.recordUrl();
        };

        window.addEventListener('hashchange', listener);
        window.addEventListener('popstate', listener);

        // 一启动就记录一次
        this.recordUrl();

        return () => {
            window.removeEventListener('hashchange', listener);
            window.removeEventListener('popstate', listener);
        };
    }

    recordUrl() {
        const url = window.location.href;
        const a = new URL(url);
        const path = a.pathname.replace(/^([^/])/, '/$1');
        const log = {
            type: 'url',
            time: Date.now(),
            url,
            detail: {
                uri: path + (a.search ? `?${a.search}` : ''),
                path,
                protocol: a.protocol.replace(':', ''),
                host: a.hostname,
                port: a.port,
                search: a.search,
                hash: a.hash.replace('#', ''),
            },
        };
        this.anys.write(log);
    }
}
