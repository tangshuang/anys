# AnysMonitorUrlPlugin

Monitor url change.


## Install

```sh
npm i anys-web-plugin-monitor-url
```

```html
<script src="https://unpkg.com/anys-web-plugin-monitor-url"></script>
```

## Usage

```js
import { AnysMonitorUrlPlugin } from 'anys-web-plugin-monitor-url';
```

```html
<script>
    const { AnysMonitorUrlPlugin } = window.anys;
    const anys = new Anys({
        plugins: [AnysMonitorUrlPlugin],
    });
</script>
```

## Options

- url: boolean

```js
const anys = new Anys({
    url: false,
});
```

## Log

```
{
    type: 'url',
    time: Date.now(),
    url,
    detail: {
        uri: path + (a.search ? `?${a.search}` : ''),
        path,
        protocol: a.protocol.replace(':', ''),
        host: a.hostname,
        port: a.port,
        search: a.search,
        hash: a.hash.replace('#', ''),
    },
}
```
