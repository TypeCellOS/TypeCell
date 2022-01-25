# Vega lite character counter

In this notebook, we'll create a chart highlighting the character occurences in a piece of text.

First, weâ€™ll create a TextArea where users can enter text:

```typescript
export let data = typecell.Input(
  <textarea style={{ width: "100%", height: 200 }} />,
  "Hello world"
);
```

Now, letâ€™s calculate character occurences in entered text:

```typescript
import * as _ from "lodash";

export let counts = _.countBy($.data.toLowerCase(), (a) => a);
```

Letâ€™s transform the map to a format thatâ€™s more easy to consume with Vega:

```typescript
export let countArray = Object.entries($.counts).map((entry) => ({
  character: entry[0],
  frequency: entry[1],
}));
```

Now, we create a frequency chart using Vega - lite. **Try changing the text** in the Textarea to see how the chart updates live.

<small>(Click the arrow on the side of the chart below to show the code)</small>

```typescript
// @default-collapsed

import { VegaLite } from "react-vega";

const spec = {
  data: { values: $.countArray },
  mark: "bar",
  autosize: "fit",
  width: "500",
  encoding: {
    x: {
      field: "character",
      type: "ordinal",
    },
    y: {
      field: "frequency",
      type: "quantitative",
    },
  },
};

export default <VegaLite spec={spec} />;
```

(Below is a copy of the TextArea, so it's easier to change the input text without scrolling up)

```typescript
// @default-collapsed

export let dataCopy = typecell.Input(
  <textarea style={{ width: "100%", height: 200 }} />,
  $views.data
);
```

_Inspired by https://observablehq.com/@observablehq/tutorial-3-visualizing-data?collection=@observablehq/tutorial_
