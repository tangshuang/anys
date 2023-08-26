import { AnysPlugin, getPath } from 'anys-shared';

export class AnysMonitorTouchEventPlugin extends AnysPlugin {
    options() {
        const isSupportTouch = 'ontouchend' in document;
        return {
            touch: isSupportTouch,
            touchstart: isSupportTouch,
            touchend: isSupportTouch,
            touchmove: isSupportTouch,
        };
    }

    addEventListener(event) {
        if (!this.anys.options.touch) {
            return;
        }

        let ticking = 0;

        const listener = (e) => {
            if (ticking) {
                return;
            }

            const { innerWidth, innerHeight } = window;
            const {
                target, identifier, force,
                pageX, pageY,
            } = e;
            const log = {
                type: event,
                time: Date.now(),
                detail: {
                    e: getPath(target),
                    width: innerWidth,
                    height: innerHeight,
                    x: pageX,
                    y: pageY,
                    identifier,
                    force,
                },
            };

            requestAnimationFrame(() => {
                this.anys.write(log);
                ticking = 0;
            });

            ticking = 1;
        };

        document.addEventListener(event, listener, true);

        return () => document.removeEventListener(event, listener);
    }

    registerTouchmove() {
        return this.addEventListener('touchmove');
    }

    registerTouchend() {
        return this.addEventListener('touchend');
    }

    registerTouchstart() {
        return this.addEventListener('touchstart');
    }
}
