import { AnysPlugin } from 'anys-utils';

export class AnysMonitorWindowSizePlugin extends AnysPlugin {
    options() {
        return {
            size: true,
        };
    }

    createRecordLog() {
        const { innerWidth: width, innerHeight: height } = window;
        const log = {
            type: 'window_size',
            time: Date.now(),
            detail: { width, height },
        };
        return log;
    }

    registerSize() {
        let request;

        const listen = () => {
            clearTimeout(request);

            const log = this.createRecordLog();
            request = setTimeout(() => {
                this.anys.write(log);
            }, 100);
        };

        // 一启动就记录一次
        this.recordSize();

        window.addEventListener('resize', listen);

        return () => {
            window.removeEventListener('resize', listen);
        };
    }

    recordSize() {
        const log = this.createRecordLog();
        this.anys.write(log);
    }
}
