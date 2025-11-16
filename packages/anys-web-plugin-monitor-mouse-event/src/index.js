import { AnysPlugin, getPath } from 'anys-utils';

export class AnysMonitorMouseEventPlugin extends AnysPlugin {
    options() {
        const isSupportTouch = 'ontouchend' in document;
        return {
            mouse: !isSupportTouch,
            click: true,
            mousemove: false,
            mousedown: false,
            mouseup: false,
            wheel: false,
            contextmenu: false,
        };
    }

    addEventListener(event, throttle) {
        if (!this.anys.options.mouse) {
            return;
        }

        const listener = this.createThrottleListener((e) => {
            const { innerWidth, innerHeight } = window;
            const {
                target, button,
                pageX, pageY,
            } = e;
            const log = {
                type: event,
                time: Date.now(),
                detail: {
                    e: getPath(target),
                    w: innerWidth,
                    h: innerHeight,
                    x: pageX,
                    y: pageY,
                    button,
                },
            };
            return log;
        }, throttle);
        document.addEventListener(event, listener, true);
        return () => document.removeEventListener(event, listener);
    }

    registerClick() {
        return this.addEventListener('click');
    }

    registerMouseup() {
        return this.addEventListener('mouseup');
    }

    registerMousedown() {
        return this.addEventListener('mousedown');
    }

    registerContextmenu() {
        return this.addEventListener('contextmenu');
    }

    registerMousemove() {
        return this.addEventListener('mousemove', 100);
    }

    registerWheel() {
        if (!this.anys.options.mouse) {
            return;
        }

        const type = 'wheel';
        const listener = this.createThrottleListener((e) => {
            const {
                target,
                deltaX,
                deltaY,
                deltaZ,
                deltaMode,
            } = e;
            const log = {
                type,
                time: Date.now(),
                detail: {
                    e: getPath(target),
                    deltaX,
                    deltaY,
                    deltaZ,
                    mode: deltaMode,
                },
            };
            return log;
        }, 100);
        document.addEventListener(type, listener);
        return () => document.removeEventListener(type, listener);
    }

    createThrottleListener(createLog, throttle) {
        let ticking = 0;
        let time = 0;
        const listener = (e) => {
            if (ticking) {
                return;
            }

            const now = Date.now();
            if (throttle && time + throttle > now) {
                return;
            }

            const log = createLog(e);
            requestAnimationFrame(() => {
                this.anys.write(log);
                ticking = 0;
                time = Date.now();
            });

            ticking = 1;
        };
        return listener;
    }
}
