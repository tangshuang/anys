import {
    getConstructorOf,
    createRandomString,
    map,
    isFunction,
    isArray,
} from 'ts-fns';

export class Anys {
    constructor(options) {
        this.$events = [];

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
         * generate this.$plugins, this.options, this.filters
         * these should be generated when constrcutor processing
         */

        const pluginOptions = {};
        const pluginFilters = [];
        const pluginDefines = {};

        const isGivenPluginsMapping = givenPluings && !isArray(givenPluings) && typeof givenPluings === 'object';
        const givenPluingList = isGivenPluginsMapping ? Object.values(givenPluings) : isArray(givenPluings) ? givenPluings : [];
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
                const msg = `[Anys]: plugin named '${name}' has been registered`;
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
                Object.assign(pluginOptions, plugin.options());
            }
            if (plugin.filters) {
                pluginFilters.push(...plugin.filters());
            }
            if (plugin.defines) {
                Object.assign(pluginDefines, plugin.defines());
            }
            plugins.push(plugin);

            // if (displayName) {
            //     pluginSet[displayName] = plugin;
            // }

            if (localName) {
                pluginSet[localName] = plugin;
            }
        });

        this.$plugins = plugins;
        this.plugins = pluginSet;
        this.options = { ...defaultOptions, ...pluginOptions, ...givenOptions };
        this.filters = [...defaultFilters, ...pluginFilters, ...givenFilters];

        /**
         * check required options which is not passed
         */
        const optionValues = Object.values(this.options);
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
        this.$basicLog = basicLog;

        /**
         * setup instance
         */

        this.invoke('init');

        if (this.options.autoStart) {
            this.start();
        }
    }

    define(key, get) {
        Object.defineProperty(this.$basicLog, key, {
            get,
            enumerable: true,
            configurable: true,
        });
    }

    on(event, callback) {
        this.$events.push([event, callback]);
    }

    off(event, callback) {
        this.$events.forEach((item, i) => {
            if (item[0] === event && item[1] === callback) {
                this.$events.splice(i, 1);
            }
        });
    }

    emit(event, ...args) {
        this.$events.forEach((item) => {
            if (item[0] === event || item[0] === '*') {
                item[1](...args);
            }
        });
    }

    invoke(type, ...args) {
        for (let i = 0, len = this.$plugins.length; i < len; i += 1) {
            const plugin = this.$plugins[i];
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
        setTimeout(() => {
            const data = { ...this.$basicLog, ...log };
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

            if (this.options.autoReport) {
                this.report();
            }
        }, 0);
    }

    report(message) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                this.emit('report', message);

                const defers = [];

                const readers = [];
                const senders = [];
                const completers = [];

                const toAsync = (...fns) => fns.reduce((deferer, fn) => isFunction(fn) ? deferer.then(fn) : deferer, Promise.resolve());
                const runAsyncAll = (fns, param) => Promise.all(fns.map(fn => toAsync(() => fn(param))));

                for (let i = 0, len = this.$plugins.length; i < len; i += 1) {
                    const plugin = this.$plugins[i];
                    if (isFunction(plugin.read) && isFunction(plugin.send)) {
                        const defer = toAsync(
                            () => plugin.read(message),
                            (data) => data && Promise.resolve(plugin.send(data)).then(() => data),
                            (data) => data && isFunction(plugin.complete) && plugin.complete(data),
                        );
                        defers.push(defer);
                    }
                    else {
                        if (isFunction(plugin.read)) {
                            readers.push(plugin.read.bind(plugin));
                        }
                        else if (isFunction(plugin.send)) {
                            senders.push(plugin.send.bind(plugin));
                        }
                        if (isFunction(plugin.complete)) {
                            completers.push(plugin.complete.bind(plugin));
                        }
                    }
                }

                const readSend = toAsync(
                    () => runAsyncAll(readers, message),
                    (groups) => {
                        const data = [];
                        groups.forEach((logs) => isArray(logs) && logs.length && data.push(...logs));
                        this.emit('read', data);
                        return data;
                    },
                    (data) => {
                        if (!data.length) {
                            return;
                        }
                        this.emit('send', data);
                        return runAsyncAll(senders, data).then(() => data);
                    },
                    (data) => {
                        if (!data) {
                            return;
                        }
                        this.emit('complete', data);
                        return runAsyncAll(completers, data);
                    },
                );

                const selfReport = Promise.all(defers);

                Promise.all([readSend, selfReport]).then(resolve, reject);
            }, 0);
        });
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
        /**
         * auto send logs to server side,
         * if false, you should must invoke .send to report manually
         */
        autoReport: true,
    };
}
