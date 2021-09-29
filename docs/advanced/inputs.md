# test1234

```typescript
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
export let textarea1 = typecell.Input(<textarea />, $views.text1);
```
```typescript
export let message = $.text1;
```
```typescript
export let text3 = typecell.Input(<input type="text" />, $views.text1);
```
```typescript
$.text1 = "asffsfsdfdfadf";
```
```typescript
export let ys = $.text1.length;
```
```typescript
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
export let c = typecell.Input(
  <input type="radio" value="test3" />,
  $views.radio1
);
```
```typescript
export default $.radio1;
```
```typescript
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
export let c = typecell.Input(
  <input type="checkbox" value="test3" />,
  $views.checkbox1
);
```
```typescript
export default $.checkbox1;
```
```typescript
export let selectMultiple = typecell.Input(
  <select multiple>
    <option value="a">a</option>
    <option value="b">b</option>
  </select>
);
```
```typescript
export default $.selectMultiple;
```
```typescript
export let select = typecell.Input(
  <select>
    <option value="a">a</option>
    <option value="b">b</option>
  </select>,
  "a"
);
```
```typescript
export default $.select;
```
```typescript
export let num = typecell.Input<number>(<input type="number" />);
```
```typescript
export default $.num;
```
```typescript
import { computed } from "mobx";

export let range = typecell.Input<number>(
  <input type="range" min="20" max="100" />
);

export default computed(() => (
  <label>
    {$.range} test: {range}
  </label>
));
```
```typescript
export default $.range;
```
```typescript
$.range = 19;

```
```typescript
// Enter code here
```