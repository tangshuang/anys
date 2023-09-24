# AnysMonitorErrorPlugin

Monitor error.

## Install

```sh
npm i anys-web-plugin-monitor-error
```

```html
<script src="https://unpkg.com/anys-web-plugin-monitor-error"></script>
```

## Usage

```js
import { AnysMonitorErrorPlugin } from 'anys-web-plugin-monitor-error';
```

```html
<script>
    const { AnysMonitorErrorPlugin } = window.anys;
    const anys = new Anys({
        plugins: [AnysMonitorErrorPlugin],
    });
</script>
```

## Options

- error: boolean, wheather monitor JSError, default `true`
- unhandledrejection: boolean, wheather monitor Promise rejection, default `true`

```js
const anys = new Anys({
    unhandledrejection: false,
});
```

## Log

**error**

```
{
    type: 'JSError',
    level: 490,
    time: Date.now(),
    msg: message,
    name,
    detail: {
        stack,
        filename,
        colno,
        lineno,
    },
}
```

```
{
    type: 'DownloadError',
    level: 489,
    time: Date.now(),
    name: target.tagName,
    detail: {
        e: getPath(target),
    },
}
```

**unhandledrejection**

```
{
    type: 'PromiseRejection',
    level: 485,
    time: Date.now(),
    name,
    detail: { message },
}
```
