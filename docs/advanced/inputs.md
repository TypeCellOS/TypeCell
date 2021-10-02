# Test input scenarios


```typescript
// Create two text inputs backed by the same variable

export let text1 = typecell.Input(<input type="text" />, "awesome");
export let text2 = typecell.Input(<input type="text" />, text1);
export default (
  <div>
    {text1}
    {text2}
  </div>
);

```

```typescript
// Now add a textarea that's also backed by this variable
export let textarea1 = typecell.Input(<textarea />, $views.text1);

```

```typescript
export let message = $.text1;

```

```typescript
// Add a text input that's also backed by the original variable
export let text3 = typecell.Input(<input type="text" />, $views.text1);

```

```typescript
// Assign to the reactive variable directly (two-way binding)
$.text1 = "Assigned value";

```

```typescript
export let ys = $.text1.length;

```

```typescript
// Test two Radio inputs part of the same group

export let radio1 = typecell.Input(<input type="radio" value="test" />);
export let radio2 = typecell.Input(
  <input type="radio" value="test2" />,
  radio1
);

export default (
  <div>
    {radio1}
    {radio2}
  </div>
);

```

```typescript
// Add a third radio input part of the same group
export let c = typecell.Input(
  <input type="radio" value="test3" />,
  $views.radio1
);

```

```typescript
// Check radio output
export default $.radio1;

```

```typescript
// Test two Checkbox inputs part of the same group
export let checkbox1 = typecell.Input(<input type="checkbox" value="test" />);
export let checkbox2 = typecell.Input(
  <input type="checkbox" value="test2" />,
  checkbox1
);
export default (
  <div>
    {checkbox1}
    {checkbox2}
  </div>
);

```

```typescript
// Add a third Checkbox input part of the same group
export let c = typecell.Input(
  <input type="checkbox" value="test3" />,
  $views.checkbox1
);

```

```typescript
// Check checkbox output
export default $.checkbox1;

```

```typescript
// Test select with "multiple" attribute
export let selectMultiple = typecell.Input(
  <select multiple>
    <option value="first">First option</option>
    <option value="second">Second option</option>
  </select>
);

```

```typescript
// Check select output
export default $.selectMultiple;

```

```typescript
// Test select without "multiple" attribute
export let select = typecell.Input(
  <select>
    <option value="first">First option</option>
    <option value="second">Second option</option>
  </select>,
  "first"
);

```

```typescript
// Check select output
export default $.select;

```

```typescript
// Test a number input
// Unfortunately, we need to manually hint the type to typecell.Input
export let num = typecell.Input<number>(<input type="number" />);

```

```typescript
export default $.num;

```

```typescript
// Reuse both the variable ($.range) and the view (range)
// immediately in the same cell.
// We need to use "computed", otherwise we'd get a circular reference

export let range = typecell.Input<number>(
  <input type="range" min="20" max="100" />
);

export default typecell.computed(() => (
  <label>
    {$.range} test: {range}
  </label>
));

```

```typescript
// check value of range
export default $.range;

```

```typescript
// test manual assingment of range
$.range = 19;

```

```typescript
// Enter code here
```