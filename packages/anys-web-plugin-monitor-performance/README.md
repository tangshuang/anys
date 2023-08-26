# AnysMonitorPerformancePlugin

1. web navigation performance
2. `anys-perf` custom element to record first render time
3. fps

## Install

```sh
npm i anys-web-plugin-monitor-performance
```

```html
<script src="https://unpkg.com/anys"></script>
<script src="https://unpkg.com/anys-web-plugin-monitor-performance"></script>
<script>
    const { Anys, AnysMonitorPerformancePlugin } = window.anys;
    const anys = new Anys({
        plugins: [AnysMonitorPerformancePlugin],
    });
</script>
```

## Config

- performance: boolean (true)
- fps: boolean | number (true)

```js
const anys = new Anys({
    plugins: [AnysMonitorPerformancePlugin],
    fps: 40, // when fps is lower than 40, anys will write a log
});
```

## Log

**performance**

```
{
    type: 'performance.navigation',
    time: Date.now(),
    detail: {
        url,
        redirectCount,
        type,
        timeOrigin,

        startTime,
        unloadEventStart,
        unloadEventEnd,
        redirectStart,
        redirectEnd,
        workerStart,
        fetchStart,
        domainLookupStart,
        domainLookupEnd,
        connectStart,
        secureConnectionStart,
        connectEnd,
        requestStart,
        responseStart,
        responseEnd,
        domInteractive,
        domContentLoadedEventStart,
        domContentLoadedEventEnd,
        domComplete,
        loadEventStart,
        loadEventEnd,

        FP,
        FCP,
        TTFB,
        LCP,
        TTI,

        TCP,
        DNS,
        REQUEST,
        RESPONSE,
        REDIRECT,
        TLS,
        COMPRESSED,
        CACHED,
        PROTOCOL,
    },
}
```

```
{
    type: 'performance.measure',
    time: Date.now(),
    name,
    detail: {
        timeOrigin,
        startTime,
        duration,
    },
}
```

```
{
    type: 'performance.dom',
    time: Date.now(),
    name,
    data: {
        // dataset on DOM element
        ...
    },
    detail: {
        timeOrigin,
        startTime: domInteractive,
        duration: now - domInteractive,
    },
}
```

**fps**

```
{
    type: 'performance.fps',
    time: Date.now(),
    fps,
    detail: {
        timeOrigin,
        startTime: firstFrame,
        duration: now - firstFrame,
    },
}
```

## API

**anys-perf**

Custom element for `div` tag, to monitor a `div` element's first render time.

```html
<div is="anys-perf" data-name="my-monitor-node"></div>
```

Dataset:

- name: the monitor point name (required)

Other dataset properties will be report at the same time.

**mark(name)**

Plugin method to create a mark and get the measure method.

```js
const anys = new Anys({
    plugins: {
        performance: AnysMonitorPerformancePlugin,
    }
})
```

```js
const measure = anys.plugins.performance.mark('my-monitor-point');
// ... do some thing
// support async tasks
measure(); // -> write a performance log and clear mark
```
