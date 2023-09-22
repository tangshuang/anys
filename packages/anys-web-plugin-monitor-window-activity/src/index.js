import { AnysPlugin } from 'anys-shared';

const enterLog = {
    type: 'window_activity.enter',
    time: Date.now(),
};

export class AnysMonitorWindowActivityPlugin extends AnysPlugin {
    options() {
        return {
            activity: true,
            deadTimeout: 0,
        };
    }

    ready() {
        if (this.anys.options.activity) {
            // record right now
            this.anys.write(enterLog);
        }
    }

    registerActivity() {
        const onvisibilitychange = () => {
            if (document.visibilityState === 'hidden') {
                const log = {
                    type: 'window_activity.focusout',
                    time: Date.now(),
                };
                this.anys.write(log);
            } else {
                const log = {
                    type: 'window_activity.focusin',
                    time: Date.now(),
                };
                this.anys.write(log);
            }
        };

        // TODO 此时立即就要卸载了，应该尝试阻塞一下
        const onunload = () => {
            const log = {
                type: 'window_activity.unload',
                time: Date.now(),
            };
            this.anys.write(log);
        };

        window.addEventListener('beforeunload', onunload, true);
        document.addEventListener('visibilitychange', onvisibilitychange, true);

        return () => {
            window.removeEventListener('beforeunload', onunload);
            document.removeEventListener('visibilitychange', onvisibilitychange);
        };
    }

    registerDeadTimeout() {
        const { deadTimeout } = this.anys.options;
        if (!deadTimeout) {
            return;
        }

        let timer;
        const listener = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                const log = {
                    type: 'window_activity.dead',
                    time: Date.now(),
                };
                this.anys.write(log);

                // @ts-ignore
            }, deadTimeout);
        };

        document.addEventListener('keydown', listener, true);
        document.addEventListener('mousedown', listener, true);
        document.addEventListener('touchstart', listener, true);
        document.addEventListener('touchmove', listener, true);
        document.addEventListener('mousemove', listener, true);
        document.addEventListener('scroll', listener, true);
        window.addEventListener('resize', listener, true);

        return () => {
            document.removeEventListener('keydown', listener);
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
            document.removeEventListener('touchmove', listener);
            document.removeEventListener('mousemove', listener);
            document.removeEventListener('scroll', listener);
            window.removeEventListener('resize', listener);
        };
    }
}
