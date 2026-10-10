# Lamp Mode

A pull-cord dark mode toggle. One monochrome icon hangs from a top corner of the
page; click it and the string is yanked down, swings, and settles straight again
while the theme flips. The cord is a small rope simulation, so it moves like a
loose string, and mashing it makes it thrash.

No dependencies, ~3 KB gzipped, no build step.

## Install

```sh
npm install lamp-mode
```

or drop it in with a script tag:

```html
<script src="https://unpkg.com/lamp-mode"></script>
```

## Use

```html
<script src="lamp-mode.js"></script>
<script>LampMode.init()</script>
```

```js
import LampMode from 'lamp-mode';   // or: const LampMode = require('lamp-mode')

LampMode.init({ position: 'left', color: '#e11' });
```

`init()` returns `{ toggle, el }`, or `null` when there is no DOM (SSR), so it is
safe to call from shared code.

### Options

| Option     | Default   | Meaning                                                    |
| ---------- | --------- | ---------------------------------------------------------- |
| `position` | `'right'` | Top corner the cord hangs from: `'left'` or `'right'`.     |
| `color`    | inherited | Any CSS color. Omit it to follow the page's text color.    |

## Theming your page

Lamp Mode sets `data-theme="light"` or `data-theme="dark"` on `<html>`. Style
against that attribute:

```css
:root              { --bg: #fafaf7; --fg: #1c1c1a; }
[data-theme="dark"] { --bg: #141416; --fg: #e8e8e4; }
body { background: var(--bg); color: var(--fg); }
```

The first visit follows `prefers-color-scheme`; after that the choice is saved in
`localStorage` (`lamp-mode-theme`). To avoid a flash of the wrong theme, you can
read that key in an inline script in `<head>` and set `data-theme` before paint.

### Color

The cord is drawn with `currentColor`, so by default it inherits the text color
of the page and flips with your theme for free. To pin it, either pass `color`
to `init()` or set the CSS variable anywhere above it:

```css
:root { --lm-color: tomato; }
```

### iPhone: hang from the very top

By default Safari keeps page content below the status bar / Dynamic Island, so
the cord starts there. To let it hang from the physical top edge, opt your page
into the full screen in the viewport tag:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

Lamp Mode is already pinned at `top: 0` and offsets itself by the left/right
safe-area insets in landscape. With `viewport-fit=cover` the rest of your page
should pad itself with `env(safe-area-inset-top)` where needed.

## Behavior

- Light is the short resting length; dark is the cord pulled further down, so the
  position of the knob shows the state.
- Every toggle (and page load) yanks the cord, then it settles. It always comes
  to rest hanging straight.
- Clicks less than 600 ms apart build a streak that throws the cord harder.
- It is a real `<button role="switch">` with `aria-checked`, focusable and
  usable from the keyboard.
- With `prefers-reduced-motion: reduce` the cord does not animate.

## Develop

```sh
npm run demo   # serves index.html at http://localhost:8472
npm test
```

## License

MIT
