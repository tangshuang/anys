import { AsyncQueue } from 'anys-shared';
import { InDB } from 'indb/es/index.js';

export class AnysStoreOfflinePlugin {
    constructor(anys) {
        this.anys = anys;
    }

    options() {
        return {
            namespace: new Error('[Anys]: options.namespace is required!'),
            /**
             * offline log will close autoReport as default,
             * developers should must invoke anys.send to send logs to server side during
             * which should use this.[offlineLogger].select to pick logs,
             * and this.[offlineLogger].remove to clear logs
             */
            autoReport: false,
            /**
             * a offline log will be delete after how long time,
             * default 2 day (48 hours)
             */
            expireTime: 3600000 * 48,
        };
    }

    init() {
        const storeName = 'anyslogs';
        const idb = new InDB({
            name: this.anys.options.namespace,
            version: 1,
            stores: [
                {
                    name: storeName,
                    primaryKeyPath: '_id',
                    autoIncrement: true,
                },
            ],
        });
        this.db = idb.use(storeName);
        this.queue = new AsyncQueue();

        /**
         * clear logs which should be delete from db
         */
        const { expireTime } = this.anys.options;
        if (expireTime) {
            let offset = 0;
            const timer = setInterval(() => {
                this.queue
                    .push(() => this.db.some(100, offset))
                    .then((logs) => {
                        if (!logs.length) {
                            clearInterval(timer);
                            return;
                        }
                        const curr = Date.now();
                        const ids = [];
                        logs.forEach((log) => {
                            const { _id, time } = log;
                            if (curr - time > expireTime) {
                                ids.push(_id);
                            }
                        });
                        if (ids.length) {
                            this.queue.push(() => this.db.delete(ids));
                        }
                        offset += 100;
                        offset -= ids.length;
                    });
            }, 10000);
        }
    }

    write(data) {
        this.queue
            .push(() => this.db.add(data))
            .then((id) => {
                this.anys.emit('writeOfflineLog', { id, data });
            });
    }

    /**
     * select records from db
     * anys.report([
     *  { key: 'time', value: Date.now() - 3600000, compare: '>' },
     *  { key: 'trace', value: 'xxx' },
     * ]);
     * https://github.com/tangshuang/indb#select
     * @param {Array} message
     * @returns
     */
    read(message) {
        if (!message) {
            message = [
                { key: 'client', value: this.anys.clientId },
                { key: 'trace', value: this.anys.traceId },
            ];
        }
        else if (!Array.isArray(message)) {
            return;
        }
        else if (message.some(item => !item.key)) {
            return;
        }
        return this.select(message);
    }

    /**
     * select records from db
     * https://github.com/tangshuang/indb#select
     * @param {Array} conditions
     * @returns
     */
    select(conditions) {
        return this.queue.push(() => this.db.select(conditions));
    }

    /**
     * delete records from db
     * @param {number|Array<number>} ids
     * @returns
     */
    remove(ids) {
        return this.queue.push(() => this.db.delete(ids)).catch(() => {});
    }
}
