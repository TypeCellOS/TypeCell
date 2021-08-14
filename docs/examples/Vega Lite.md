# Vega lite character counter

First, we'll create a TextArea where users can enter text:

```typescript
export let data = "Hello world"; // initial value

export default (
  <textarea
    style={{ width: "100%", height: 200 }}
    defaultValue={data}
    onChange={(e) => ($.data = e.target.value)}
  />
);
```
Now, let's calculate character occurences in entered text:

```typescript
import * as _ from "lodash";

export let counts = _.countBy($.data.toLowerCase(), (a) => a);
```
Let's transform the map to a format that's more easy to consume with Vega:

```typescript
export let countArray = Object.entries($.counts).map((entry) => ({
  character: entry[0],
  frequency: entry[1],
}));

```
Now, we create a frequency chart using Vega-lite

```typescript
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
*Inspired by https://observablehq.com/@observablehq/tutorial-3-visualizing-data?collection=@observablehq/tutorial*
