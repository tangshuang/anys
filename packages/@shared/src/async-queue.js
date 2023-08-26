export class AsyncQueue {
    constructor() {
        this.queue = [];
        this.status = 0;
    }

    push(runner) {
        let resolve; let
            reject;
        const defer = new Promise((rs, rj) => {
            resolve = rs;
            reject = rj;
        });
        const item = {
            runner,
            resolve,
            reject,
        };
        this.queue.push(item);

        const run = () => {
            setTimeout(() => {
                if (!this.queue.length) {
                    this.status = 0;
                    return;
                }

                const { runner: fn, resolve: rs, reject: rj } = this.queue.shift();
                fn().then(rs, rj).finally(run);
            }, 0);
            this.status = 1;
        };

        if (!this.status) {
            run();
        }

        return defer;
    }
}
