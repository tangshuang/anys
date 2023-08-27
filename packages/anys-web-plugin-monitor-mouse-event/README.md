# AnysMonitorMouseEventPlugin

Monitor mouse event.

## Install

```sh
npm i anys-web-plugin-monitor-mouse-event
```

```html
<script src="https://unpkg.com/anys-web-plugin-monitor-mouse-event"></script>
```

## Usage

```js
import { AnysMonitorMouseEventPlugin } from 'anys-web-plugin-monitor-mouse-event';
```

```html
<script>
    const { AnysMonitorMouseEventPlugin } = window.anys;
    const anys = new Anys({
        plugins: [AnysMonitorMouseEventPlugin],
    });
</script>
```

## Options

- mouse: !isSupportTouch, total switch, when `false` all options items will not work
- click: true,
- mousemove: false,
- mousedown: false,
- mouseup: false,
- wheel: false,
- contextmenu: false,

```js
const anys = new Anys({
    mouse: false,
});
```

## Log

```
{
    type: 'click' | 'mousemove' | 'mousedown' | 'mouseup' | 'contextmenu',
    time: Date.now(),
    detail: {
        e: getPath(target),
        w: innerWidth,
        h: innerHeight,
        x: pageX,
        y: pageY,
        button,
    },
}
```

```
{
    type: 'wheel',
    time: Date.now(),
    detail: {
        e: getPath(target),
        deltaX,
        deltaY,
        deltaZ,
        mode: deltaMode,
    },
}
```
