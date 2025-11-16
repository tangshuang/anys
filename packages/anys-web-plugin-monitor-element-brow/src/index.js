/* eslint-disable max-classes-per-file */

import { AnysPlugin, getPath } from 'anys-utils';

let customElementRegistered = false;
let browCallback = null;

class AnysBrowElement extends HTMLDivElement {
    connectedCallback() {
        browCallback?.(this);
    }
}

export class AnysMonitorElementBrowPlugin extends AnysPlugin {
    options() {
        return {
            brow: true,
        };
    }

    registerBrow() {
        let observers = {};
        const callback = (entries, observer) => {
            entries.forEach((entry) => {
                const { target, intersectionRect } = entry;
                const { dataset } = target;
                const { name, ...data } = dataset;
                if (!name) {
                    return;
                }

                const {
                    left, right,
                    top, bottom,
                    x, y,
                } = intersectionRect;
                if (Math.max(left, right, top, bottom) === 0) {
                    return;
                }
                const log = {
                    type: 'element.brow',
                    time: Date.now(),
                    name,
                    data,
                    detail: {
                        e: getPath(target),
                        left,
                        right,
                        top,
                        bottom,
                        x,
                        y,
                    },
                };
                this.anys.write(log);
                observer.unobserve(target);
            });
        };

        browCallback = (element) => {
            const { width, height } = element.getBoundingClientRect();
            const { innerWidth, innerHeight } = window;
            const widthThreshold = Math.min(innerWidth / 2 / width, 1);
            const heightThreshold = Math.min(innerHeight / 2 / height, 1);
            const threshold = widthThreshold * heightThreshold * 0.5;

            if (!observers[threshold]) {
                const observer = new IntersectionObserver(callback, {
                    root: null,
                    rootMargin: '0px',
                    threshold,
                });
                observers[threshold] = observer;
            }

            observers[threshold].observe(element);
        };

        if (!customElementRegistered) {
            /**
             * @example
             * <div is="anys-brow" data-name="report-point-name"></div>
             * Notice: data-name is required
             */
            customElements.define('anys-brow', AnysBrowElement, { extends: 'div' });
        }

        return () => {
            Object.values(observers).forEach((observer) => {
                observer.disconnect();
            });
            observers = {};
            browCallback = null;
        };
    }
}
