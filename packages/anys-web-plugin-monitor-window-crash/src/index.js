import { AnysPlugin } from 'anys-shared';
import { createRandomString } from 'ts-fns';

const key = 'anys_client_id_for_crash_monitor';
const id = sessionStorage.getItem(key) || createRandomString(6);
sessionStorage.setItem(key, id);
const sym = 'anys_clients_info_for_crash_monitor';

export class AnysMonitorWindowCrashPlugin extends AnysPlugin {
    options() {
        return {
            crash: true,
        };
    }

    ready() {
        const channel = new BroadcastChannel(`anys_for_crash:${id}`);
        channel.onmessage = (e) => {
            const { data } = e;
            if (data === 'ping') {
                channel.postMessage('pong');
            }
        };

        const removeById = (id) => {
            const info = localStorage.getItem(sym);
            const items = info ? JSON.parse(info) : [];
            const nextItems = items.filter((item) => item.id !== id);
            const next = JSON.stringify(nextItems);
            localStorage.setItem(sym, next);
        };

        const info = localStorage.getItem(sym);
        const items = info ? JSON.parse(info) : [];
        const now = Date.now();
        items.forEach((item) => {
            const { id, url, time } = item;
            const chn = new BroadcastChannel(`anys_for_crash:${id}`);
            let beatOk = false;
            chn.postMessage('ping');
            chn.onmessage = (e) => {
                const { data } = e;
                if (data === 'pong') {
                    beatOk = true;
                }
            };
            setTimeout(() => {
                if (!beatOk) {
                    const log = {
                        type: 'window_crash',
                        time,
                        url,
                        detail: {
                            time,
                            now,
                        },
                    };
                    this.anys.write(log);
                    removeById(id);
                }
                chn.close();
            }, 1000);
        });
    }

    registerCrash() {
        const updateBeat = () => {
            const info = localStorage.getItem(sym);
            const items = info ? JSON.parse(info) : [];
            const url = window.location.href;
            const time = Date.now();

            const item = items.find((item) => item.id === id);
            if (item) {
                item.url = url;
                item.time = time;
            } else {
                items.push({ id, url, time });
            }

            const next = JSON.stringify(items);
            localStorage.setItem(sym, next);
        };

        const removeBeat = () => {
            const info = localStorage.getItem(sym);
            const items = info ? JSON.parse(info) : [];

            const nextItems = items.filter((item) => item.id !== id);
            const next = JSON.stringify(nextItems);
            localStorage.setItem(sym, next);
        };

        setInterval(updateBeat, 3000);

        window.addEventListener('beforeunload', removeBeat);
    }
}
