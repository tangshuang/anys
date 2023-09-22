import {
    getConstructorOf,
    createRandomString,
    map,
    isFunction,
    isArray,
} from 'ts-fns';

export class Anys {
    constructor(options) {
        this._events = [];
        this._queue = [];

        const Constructor = getConstructorOf(this);

        const {
            filters: defaultFilters = [],
            plugins: defaultPluings = [],
            ...defaultOptions
        } = {
            ...Anys.defaultOptions,
            ...(Constructor.defaultOptions || {}),
        };

        const {
            filters: givenFilters = [],
            plugins: givenPluings = [],
            defines: givenDefines = [],
            ...givenOptions
        } = options || {};

        /**
         * generate this.plugins, this.options, this.filters
         * these should be generated when constrcutor processing
         */

        const pluginOptions = {};
        const pluginFilters = [];
        const pluginDefines = {};

        const isGivenPluginsMapping = givenPluings && !isArray(givenPluings) && typeof givenPluings === 'object';
        const givenPluingList = isGivenPluginsMapping ? objectValues(givenPluings) : isArray(givenPluings) ? givenPluings : [];
        const givenPluginMapping = isGivenPluginsMapping ? Object.keys(givenPluings).map((key) => ({ key, value: givenPluings[key] })) : [];

        // create a plugin list which is sorted be dependence direction
        const pluginsDraft = [...defaultPluings, ...givenPluingList];
        const mergePluginDeps = (pluginList) => {
            pluginList.forEach((Plugin) => {
                const depPlugins = Plugin.dependencies || [];
                depPlugins.forEach((dep) => {
                    pluginsDraft.unshift(dep);
                });
                mergePluginDeps(depPlugins);
            });
        };
        mergePluginDeps(pluginsDraft);
        const pluginList = pluginsDraft.filter((item, i) => i === pluginsDraft.indexOf(item));

        const plugins = [];
        const pluginSet = {};
        pluginList.forEach((Plugin) => {
            const warnExist = (name) => {
                const msg = `plugin named '${name}' has been registered`;
                if (!(pluginSet[name] instanceof Plugin)) {
                    console.error(msg, Plugin, pluginSet);
                }
                else {
                    console.debug(msg, Plugin, pluginSet);
                }
            }

            const localName = givenPluginMapping.find(item => item.value === Plugin)?.key;
            if (localName && pluginSet[localName]) {
                warnExist(localName);
                return;
            }

            // const { displayName } = Plugin;
            // if (displayName && pluginSet[displayName]) {
            //     warnExist(displayName);
            //     return;
            // }

            const deps = (Plugin.dependencies || [])
                .map((P) => plugins.find((item) => item instanceof P));
            const plugin = new Plugin(this, deps);
            if (plugin.options) {
                objectAssign(pluginOptions, plugin.options());
            }
            if (plugin.defines) {
                objectAssign(pluginDefines, plugin.defines());
            }
            if (plugin.filters) {
                pluginFilters.push(...plugin.filters());
            }
            plugins.push(plugin);

            // if (displayName) {
            //     pluginSet[displayName] = plugin;
            // }

            if (localName) {
                pluginSet[localName] = plugin;
            }
        });

        this._pluginList = plugins;
        this.plugins = pluginSet;
        this.options = { ...defaultOptions, ...pluginOptions, ...givenOptions };
        this.filters = [...defaultFilters, ...pluginFilters, ...givenFilters];

        /**
         * check required options which is not passed
         */
        const optionValues = objectValues(this.options);
        const requiredOption = optionValues.find((item) => item && item instanceof Error);
        if (requiredOption) {
            throw requiredOption;
        }

        /**
         * init log basic properties
         * clientId, traceId, requestId are special
         */

        const definitions = {
            ...pluginDefines,
            ...givenDefines,
        };

        this.definitions = definitions;
        this.clientId = definitions.client ? definitions.client() : createRandomString(8);
        this.traceId = definitions.trace ? definitions.trace() : createRandomString(8);
        this.requestId = createRandomString(8);

        const basicLog = {};
        Object.defineProperties(basicLog, map(definitions, (define) => ({
            get: isFunction(define) ? define : () => define,
            enumerable: true,
            configurable: true,
        })));
        Object.defineProperties(basicLog, {
            client: {
                get: () => this.clientId,
                enumerable: true,
                configurable: true,
            },
            trace: {
                get: () => this.traceId,
                enumerable: true,
                configurable: true,
            },
            request: {
                get: () => this.requestId,
                enumerable: true,
                configurable: true,
            },
        });
        this._basicLog = basicLog;

        /**
         * setup instance
         */

        this.invoke('init');
        this._inited = true;
        this.invoke('ready');

        if (this.options.autoStart) {
            this.start();
        }
    }

    define(key, get) {
        Object.defineProperty(this._basicLog, key, {
            get,
            enumerable: true,
            configurable: true,
        });
    }

    on(event, callback) {
        this._events.push([event, callback]);
    }

    off(event, callback) {
        this._events.forEach((item, i) => {
            if (item[0] === event && item[1] === callback) {
                this._events.splice(i, 1);
            }
        });
    }

    emit(event, ...args) {
        this._events.forEach((item) => {
            if (item[0] === event || item[0] === '*') {
                item[1](...args);
            }
        });
    }

    invoke(type, ...args) {
        for (let i = 0, len = this._pluginList.length; i < len; i += 1) {
            const plugin = this._pluginList[i];
            if (!plugin[type]) {
                continue;
            }
            if (!isFunction(plugin[type])) {
                continue;
            }
            plugin[type](...args);
        }
    }

    refreshTraceId() {
        const prevTraceId = this.traceId;
        this.traceId = this.definitions.trace ? this.definitions.trace() : createRandomString(8);
        this.emit('refreshTraceId', { prev: prevTraceId, next: this.traceId });
    }

    refreshRequestId() {
        const prevRequestId = this.requestId;
        this.requestId = createRandomString(8);
        this.emit('refreshRequestId', { prev: prevRequestId, next: this.requestId });
    }

    start() {
        this.invoke('start');
        this.emit('start');
    }

    write(log) {
        if (!this._inited) {
            throw new Error('could not write before ready');
        }

        const data = { ...this._basicLog, ...log };
        // check wheather the log can be write into
        const { filters } = this;
        for (let i = 0, len = filters.length; i < len; i += 1) {
            const filter = filters[i];
            if (!filter(data)) {
                return;
            }
        }

        this.invoke('write', data);
        this.emit('write', data);
    }

    report(message) {
        if (!this._inited) {
            throw new Error('could not report before ready');
        }

        let resolve, reject;
        const defer = new Promise((ro, re) => {
            resolve = ro;
            reject = re;
        });
        const signal = { message, resolve, reject };
        this._queue.push(signal);

        this._reporting = false;
        const run = () => {
            if (this._reporting) {
                return;
            }

            this._reporting = true;

            const signal = this._queue.shift();
            if (!signal) {
                return;
            }

            const { message, resolve, reject } = signal;
            this.emit('report', message);

            const operators = [];

            for (let i = 0, len = this._pluginList.length; i < len; i += 1) {
                const plugin = this._pluginList[i];
                const operator = {};
                let flag = 0;
                if (isFunction(plugin.read)) {
                    operator.read = plugin.read.bind(plugin);
                    flag = 1;
                }
                if (isFunction(plugin.send)) {
                    operator.send = plugin.send.bind(plugin);
                    flag = 1;
                }
                if (isFunction(plugin.clear)) {
                    operator.clear = plugin.clear.bind(plugin);
                    flag = 1;
                }
                if (flag) {
                    operators.push(operator);
                }
            }

            const runAsync = (fn, ...args) => Promise.resolve().then(() => isFunction(fn) ? fn(...args) : null);
            const runAsyncPipe = (...fns) => fns.reduce((deferer, fn) => isFunction(fn) ? deferer.then(fn) : deferer, Promise.resolve());

            runAsyncPipe(
                () => Promise.all(operators.map((operator) => {
                    return runAsync(operator.read, message).then((data) => {
                        operator.data = data;
                        return data;
                    });
                })),
                (groups) => {
                    const data = [];
                    groups.forEach((logs) => {
                        if (isArray(logs) && logs.length) {
                            data.push(...logs);
                        }
                    });
                    this.emit('read', data);
                    return data;
                },
                (data) => {
                    if (!data.length) {
                        return;
                    }
                    this.emit('send', data);
                    return Promise.all(operators.map((operator) => {
                        return runAsync(operator.send, operator.data, data);
                    })).then(() => data);
                },
                (data) => {
                    if (!data) {
                        return;
                    }
                    this.emit('clear', data);
                    return Promise.all(operators.map((operator) => {
                        return runAsync(operator.clear, operator.data);
                    }));
                },
            ).then(resolve, reject).finally(() => {
                this._reporting = false;
                run();
            });
        };

        run();

        return defer;
    }

    stop() {
        this.invoke('stop');
        this.emit('stop');
    }

    static defaultOptions = {
        /**
         * whether start plugins automaticly
         */
        autoStart: true,
    };
}

function objectValues(obj) {
    const keys = Object.keys(obj);
    const values = keys.map(key => obj[key]);
    return values;
}

function objectAssign(obj1, obj2) {
    const keys = Object.keys(obj2);
    keys.forEach((key) => {
        const value = obj2[key];
        obj1[key] = value;
    });
    return obj1;
}
