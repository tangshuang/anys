# Anys Web

Compose anys web features together.

## Install

```sh
npm i anys-web
```

```html
<script src="https://unpkg.com/anys-web"></script>
```

## Usage

```js
import { create } from 'anys-web';
```

```html
<script>
    const { create } = window.anys;
</script>
```

## API

**create**

Create an Anys instance which compose many features together, the plugins used:

- AnysStoreOfflinePlugin
- AnysMonitorUrlPlugin
- AnysMonitorWindowSizePlugin
- AnysMonitorDOMMutationPlugin
- AnysIdentifyPlugin
- AnysMonitorAjaxPlugin
- AnysMonitorInputEventPlugin
- AnysMonitorMouseEventPlugin
- AnysMonitorWindowActivityPlugin
- AnysMonitorTouchEventPlugin
- AnysMonitorScrollEventPlugin


```js
const anys = create({
    reportUrl: '/api/report',
});
```

Here you will have `anys.plugins.recorder`.
