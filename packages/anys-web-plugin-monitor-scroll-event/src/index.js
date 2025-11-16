import { AnysPlugin, getPath } from 'anys-utils';

export class AnysMonitorScrollEventPlugin extends AnysPlugin {
    options() {
        return {
            scroll: true,
        };
    }

    registerScroll() {
        let ticking = 0;

        const listen = (e) => {
            if (ticking) {
                return;
            }

            const { target, bubbles } = e;
            let log;
            if (bubbles) {
                const { scrollX, scrollY } = window;
                log = {
                    type: 'window_scroll',
                    time: Date.now(),
                    detail: { scrollX, scrollY },
                };
            }
            else {
                const { scrollLeft, scrollTop } = target;
                log = {
                    type: 'scroll',
                    time: Date.now(),
                    target: getPath(target),
                    detail: { scrollLeft, scrollTop },
                };
            }

            requestAnimationFrame(() => {
                this.anys.write(log);
                ticking = 0;
            });

            ticking = 1;
        };

        window.addEventListener('scroll', listen, true);

        return () => {
            window.removeEventListener('scroll', listen);
        };
    }
}
