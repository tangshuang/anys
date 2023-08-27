# Anys

Anys SDK core program.

## Install

```sh
npm i anys
```

```html
<script src="https://unpkg.com/anys/dist/index.js"></script>
```

## Usage

```js
import { Anys } from 'anys';

const anys = new Anys(options);
```

```html
<script>
    const { Anys } = window.anys;
    const anys = new Anys(options);
</script>
```

## Options

- autoStart: boolean, wheather start anys process after initialize, default `true`
- plugins: array|object
- defines: object, getter functions to define basic properties on all logs
- filters: array, filter functions to keep or remove a log before `write` lifecycle

And, different plugins require its own configs, you will read plugins' configs in their own document.

Plugins can be an array or an object, when you give an object, you can read plugin instances on `anys.plugins` property, for example:

```js
const anys = new Anys({
    plugins: {
        offlineStore: AnysStoreOfflinePlugin,
    },
});

// here now we can invoke anys.plugins to get plugin instance
const { offlineStore } = anys.plugins;
// invoke plugin api
const logs = await offlineStore.select([
    { key: 'time', value: Date.now() - 3600000, compare: '>' },
]);
```

## Property

You can read the following properties on anys instance:

- clientId
- traceId
- requestId
- options

## Method

**start()**

Start anys process.

**stop()**

Stop anys process.
After stopping, you can invoke `start` to restart the process.

**define(key, get)**

Provide a new property for all logs by define it with a getter function.

```js
anys.define('user', () => getCurrentUserId());
```

**refreshTraceId()**

Refresh traceId.

**refreshRequestId()**

Refresh requestId.

**write(log)**

Ask anys to write a log into its cache.

If a log is filtered by given `filters`, it will not be written.

**report(message)**

Ask anys to report logs to your server side.

**on(event, callback)**

Bind listener for event.

Events: start, write, report, read, send, clear, stop, refreshTraceId, refreshRequestId.
