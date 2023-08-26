/* eslint-disable no-unused-expressions */
/* eslint-disable max-classes-per-file */
/* eslint-disable no-shadow */
/* eslint-disable max-len */
/* eslint-disable func-names */

const ASYNC_PLUGINS = {};

function createCache(options) {
    const queue = [];
    const cache = {
        loaded: 0,
        push(options) {
            queue.push(options);
        },
    };

    queue.push(options);

    const emit = (fn, e) => {
        queue.forEach((options) => {
            options[fn] && options[fn](e);
        });
    };

    const { url, done } = options;

    const script = document.createElement('script');
    script.src = url;
    script.onprogress = (e) => emit('onProgress', e);
    script.onload = (e) => {
        cache.loaded = 1;
        emit('onLoaded', e);
        document.body.removeChild(script);
        done();
    };
    script.onerror = (e) => emit('onError', e);
    script.defer = true;
    document.body.appendChild(script);

    return cache;
}

class AsyncBasePlugin {
    constructor(anys) {
        this.anys = anys;
        this.started = 0;
        this.source = null; // source Plugin
        this.loadPlugin();
    }

    loadPlugin() { }

    start() {
        this.started = 1;
    }
}

export function AsyncPlugin(options) {
    const {
        pluginUrl,
        pluginName,
        onInit,
        onProgress,
        onLoaded,
        onError,
        onReady,
    } = options || {};

    let resolve;
    const defer = new Promise((r) => {
        resolve = r;
    });

    const cache = ASYNC_PLUGINS[pluginUrl];
    const done = () => {
        // @ts-ignore
        const Plugin = window.anys && window.anys[pluginName];
        if (!Plugin) {
            onError && onError(`[Anys]: AsyncPlugin "${pluginUrl}" not fond at window.anys.${pluginName}`);
        } else {
            resolve(Plugin);
        }
    };
    if (cache && cache.loaded) {
        done();
    } else if (cache) {
        cache.push({
            done,
            onProgress,
            onLoaded,
            onError,
        });
    } else {
        createCache({
            url: pluginUrl,
            done,
            onProgress,
            onLoaded,
            onError,
        });
    }

    class AsyncPlugin extends AsyncBasePlugin {
        init() {
            onInit && onInit(this.anys);
            this.$ready = new Promise(r => this.$setReady = r);
        }

        loadPlugin() {
            defer.then((Plugin) => {
                // set source firstly
                this.source = Plugin;

                // build plugin list which will be generate later
                const depsDraft = [];
                const mergePluginDeps = (pluginList) => {
                    pluginList.forEach((Plg) => {
                        const depPlugins = Plg.dependencies || [];
                        depPlugins.forEach((dep) => {
                            depsDraft.unshift(dep);
                        });
                        mergePluginDeps(depPlugins);
                    });
                };
                mergePluginDeps(Plugin.dependencies || []);
                const pluginList = depsDraft.filter((Dep, i) => {
                    if (i !== depsDraft.indexOf(Dep)) {
                        return false;
                    }
                    if (this.anys.$plugins.some((item) => item instanceof Dep)) {
                        return false;
                    }
                    if (this.anys.$plugins.some((item) => item instanceof AsyncBasePlugin && item.source === Dep)) {
                        return false;
                    }
                    return true;
                });
                pluginList.push(Plugin);

                // initailize plugins
                const { $plugins, plugins } = this.anys;
                pluginList.forEach((Plugin) => {
                    // const warnExist = (name) => {
                    //     const msg = `[Anys]: async plugin named '${name}' has been registered`;
                    //     if (!(plugins[name] instanceof Plugin)) {
                    //         console.error(msg, Plugin, plugins);
                    //     }
                    //     else {
                    //         console.debug(msg, Plugin, plugins);
                    //     }
                    // }

                    // const { displayName } = Plugin;
                    // if (displayName && plugins[displayName]) {
                    //     warnExist(displayName);
                    //     return;
                    // }

                    const deps = (Plugin.dependencies || [])
                        .map((P) => $plugins.find((item) => {
                            if (item instanceof P) {
                                return true;
                            }
                            if (item instanceof AsyncBasePlugin && item.source === P) {
                                return true;
                            }
                            return false;
                        }));

                    const plugin = new Plugin(this, deps);

                    if (plugin.options) {
                        Object.assign(this.anys.options, plugin.options());
                    }
                    if (plugin.filters) {
                        this.anys.filters.push(...plugin.filters());
                    }
                    if (plugin.defines) {
                        const defs = plugin.defines();
                        const attrs = Object.keys(defs);
                        attrs.forEach((attr) => {
                            this.anys.define(attr, defs[attr]);
                        });
                    }

                    // patch plugin to anys instance
                    $plugins.push(plugin);
                    // if (displayName) {
                    //     plugins[displayName] = plugin;
                    // }

                    onReady && onReady(plugin);

                    if (this.started) {
                        plugin.start && plugin.start();
                    }

                    this.$setReady(plugin);
                });
            });
        }

        ready() {
            return this.$ready;
        }
    }

    return AsyncPlugin;
}
