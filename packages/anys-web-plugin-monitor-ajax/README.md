# AnysMonitorAjaxPlugin

Monitor ajax.

## Install

```sh
npm i anys-web-plugin-monitor-ajax
```

```html
<script src="https://unpkg.com/anys-web-plugin-monitor-ajax"></script>
```

## Usage

```js
import { AnysMonitorAjaxPlugin } from 'anys-web-plugin-monitor-ajax';
```

```html
<script>
    const { AnysMonitorAjaxPlugin } = window.anys;
    const anys = new Anys({
        plugins: [AnysMonitorAjaxPlugin],
    });
</script>
```

## Options

- xhr: boolean, wheather to monitor XMLHttpRequest
- fetch: boolean, wheather to monitor fetch function
- ajaxResponse: boolean, wheather to record ajax response, when set to false, response data will be removed from log
- patchRequestId: boolean, wheather to patch anys.traceId + anys.requestId to each ajax request's url search query with a key `_request_id`

```js
const anys = new Anys({
    ajaxResponse: false,
    patchRequestId: false,
});
```

## Log

**xhr**

```
{
    type: 'xhr.req',
    time: Date.now(),
    name: `xhr_${name}`,
    url,
    detail: {
        method,
        async,
        body,
    },
}
```

```
{
    type: 'xhr.ok' | 'xhr.fail' | 'xhr.err',
    time: Date.now(),
    name: `xhr_${name}`,
    url,
    detail: {
        status: xhr.status,
        method,
        responseType,
        response: response || undefined,
    },
}
```

**fetch**

```
{
    type: 'fetch.init',
    time: Date.now(),
    name: `fetch_${name}`,
    url,
    detail: { body, method },
}
```

```
{
    type: 'fetch.ok',
    time: Date.now(),
    name: `fetch_${name}`,
    url,
    detail: {
        status,
        data,
        method,
    },
}
```

```
{
    type: 'fetch.fail',
    time: Date.now(),
    name: `fetch_${name}`,
    url,
    detail: {
        status,
        method,
    },
}
```

```
{
    type: 'fetch.err',
    time: Date.now(),
    name: `fetch_${name}`,
    url,
    detail: {
        method,
        err: message,
    },
}
```
