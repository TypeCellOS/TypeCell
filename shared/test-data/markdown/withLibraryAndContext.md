plain text

```typescript id=234234
import * as lodash from "lodash";
export let x = lodash.sum([5, 1]);
```

this shows how to reuse x:

```typescript
export let y = $.x + 1;
```

rain confetti!

```typescript
import { create } from "canvas-confetti";

export const canvas = document.createElement("canvas");
canvas.width = 200;
canvas.height = 100;

const myConfetti = create(canvas);

// Drop some confetty every 500ms
setInterval(() => myConfetti({ particleCount: 70, origin: { y: 0 } }), 500);
```
