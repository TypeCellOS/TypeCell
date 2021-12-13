# Introduction to TypeCell Codebooks

Welcome to TypeCell Codebooks. A codebook is a live, interactive programming environment for Javascript / Typescript
running in your browser.

In this introduction, we will go through the basics of using TypeCell Codebooks.

## Cats

Let's say you're like my grandma, and you have a lot of cats. Our story will be about them.

### Step 1: give your cat a name!

```typescript
export let cat = {
  name: "",
  prefersDryFood: false,
  foodPerWeek: 4,
};
```

```typescript
// @default-collapsed

let message;

// Notice how exported variables are made available under the $-sign.
if ($.cat.name === "") {
  message = <div>❌ Try changing the "name" field in the code above.</div>;
} else if (!$.cat.name.match(/^[a-zA-Z0-9\s]+$/)) {
  message = (
    <div>
      ❌ Oh no! Someone messed with my pretty introduction. Change the code
      above to give our cat a proper name (without special characters)!
    </div>
  );
} else {
  message = (
    <div>
      <strong>✅ Well done, your cat is called {$.cat.name} now.</strong> This
      text gets updated every time you change the name -{" "}
      <em>instantly, as you type</em>. To see how the magic works,{" "}
      <strong>click on the arrow (&rsaquo;) to the left of this text.</strong>
    </div>
  );
}

export default message;
```

### Step 2: Friends

```typescript
export default (
  <div>I feel like our cat needs a friend. Let's call him {$.friend.name}.</div>
);
```

Uh oh, what's this? I forgot to add a cell defining our friend. Can you do it for me?

A cell is a container for code & output. To add one, click on the + above or below another cell.
You can do it wherever you like.

```typescript
// @default-collapsed

let completeEmoji = $.friend && $.friend.name ? "✅" : "❌";

export default (
  <div>
    <strong>{completeEmoji} Step 2: </strong> Create a second cat in a new cell
    and export it as variable 'friend'.
  </div>
);
```

<small><strong>Hint:</strong> Our friend only needs a name for now. Use the same structure as you already
used for your cat, but only include the `name` field.</small>

Notice how we use `$.friend.name` in the cell above. Whenever you `export` a variable, you can access it across
the document by using the `$` symbol. In other words, `$` is a store for all variables that you want
to access across cells! Exported variables are also displayed below the cell.

Code cells automatically run when:

- You change the code of a cell
- Any of the reactive variables the cell references (from `$`) are changed

## Feeding neighbors

Our cats have some neighbors. Let's involve them in the story too!

```typescript
export let neighbors = [
  $.cat,
  $.friend,
  {
    name: "Smerfetka",
    prefersDryFood: true,
    foodPerWeek: 3,
  },
  {
    name: "Latte",
    prefersDryFood: false,
    foodPerWeek: 4,
  },
];
```

Now, if you're like my grandma, you're feeding the entire neighborhood by yourself, but you don't
yet know if our friend prefers dry/wet food or how many cans they eat per week.

```typescript
// @default-collapsed

let completeEmoji =
  $.friend?.prefersDryFood !== undefined && isFinite($.friend?.foodPerWeek)
    ? "✅"
    : "❌";

export default (
  <div>
    <strong>{completeEmoji} Step 3: </strong> Add the{" "}
    <code>prefersDryFood</code> and <code>foodPerWeek</code> fields to our
    friend that you defined earlier!
  </div>
);
```

### Feeding the cats

Alright, once you've completed steps 1 - 3, let's see how much food you need to prepare. We do this in the cell below:

```typescript
// Repeats a character a number of times and returns the string.
export function repeat(char: string, times: number) {
  let completeString = "";
  for (let i = 0; i < times; i++) {
    completeString += char;
  }
  return completeString;
}

// Numbers indicating the number of wet food cans and dry food packs to prepare.
// E.g. dryFoodToPrepare is the sum of cansPerWeek across neighbors where
// prefersDryFood is true.
export let dryFoodToPrepare = 0;
export let wetFoodToPrepare = 0;

for (let i = 0; i < $.neighbors.length; i++) {
  if ($.neighbors[i] !== undefined && $.neighbors[i].foodPerWeek) {
    if ($.neighbors[i].prefersDryFood) {
      dryFoodToPrepare += $.neighbors[i].foodPerWeek;
    } else {
      wetFoodToPrepare += $.neighbors[i].foodPerWeek;
    }
  }
}

const dryFoodAsString = repeat("🍱", dryFoodToPrepare);
const wetFoodAsString = repeat("🥫", wetFoodToPrepare);

// Note:
// - How we're using JSX to render output
// - A "default" export indicates how to display the output of the cell
//   (you can try removing the lines below to see all exported variables)
export default (
  <div>
    <div>Dry food packs to prepare for the cats: {dryFoodAsString}.</div>
    <div>Wet food cans to prepare for the cats: {wetFoodAsString}.</div>
  </div>
);
```

We have now stored the number of dry & wet food required (we exported variables `dryFoodToPrepare` and `wetFoodToPrepare`).
We also visualize them nicely with a friendly message and emojis using React & JSX.
See the default `export` at the end of the cell above.

<small>React? JSX? What's this now? React is a Javascript framework that's used
to create user interfaces. We won't go too in depth on it here, but you can
check out the documentation at https://reactjs.org/docs/getting-started.html.

JSX is part of React, and makes it easy to create type-safe HTML elements. In TypeCell, just `export` JSX elements to create user interfaces or visualize data in your notebook.</small>

Next, we'll create some user input fields to indicate how much food we have prepared.
The built-in TypeCell Input library makes this easy:

```typescript
export let dryFoodPrepared = typecell.Input<number>(
  <input type="range" min="0" max="20" />,
  0
);

// Notice again how we can export the values returned by our inputs...
export let wetFoodPrepared = typecell.Input<number>(
  <input type="number" min="0" max="20" />,
  0
);

// ...but can choose to only display the inputs themselves with a default export.
export default (
  <div>
    <div>
      Number of dry food packs prepared:
      {dryFoodPrepared}
    </div>
    <div>
      Number of wet food cans prepared:
      {wetFoodPrepared}
    </div>
  </div>
);
```

Now, let's also create some cells to calculate whether we have prepared enough food:

```typescript
// @default-collapsed

// Setting displayed message for dry food.
export const dryFoodRemaining = $.dryFoodPrepared - $.dryFoodToPrepare;

let dryFoodMessage = (
  <p>Great! We prepared just enough dry food, there are no more packs left!</p>
);

if (dryFoodRemaining < 0) {
  dryFoodMessage = (
    <p>
      Oh no! We haven't prepared enough dry food. Better move the slider up!
    </p>
  );
} else if (dryFoodRemaining > 0) {
  dryFoodMessage = (
    <p>
      Yummie!! The cats have eaten a few packs and we still have{" "}
      {dryFoodRemaining} packet(s) left: {$.repeat("🍱", dryFoodRemaining)}
    </p>
  );
}

export default dryFoodMessage;
```

```typescript
// @default-collapsed

// Setting displayed message for wet food.
export const wetFoodRemaining = $.wetFoodPrepared - $.wetFoodToPrepare;

let wetFoodMessage = (
  <p>
    Sweet! We prepared just enough wet food, the cats have eaten all the cans!
  </p>
);

if (wetFoodRemaining < 0) {
  wetFoodMessage = (
    <p>
      Oh no! We haven't prepared enough wet food. Try increasing the value in
      the number field!
    </p>
  );
} else if (wetFoodRemaining > 0) {
  wetFoodMessage = (
    <p>
      Delicious!! The cats have eaten some cans and we still have{" "}
      {wetFoodRemaining} can(s) left: {$.repeat("🥫", wetFoodRemaining)}
    </p>
  );
}

export default wetFoodMessage;
```

```typescript
// @default-collapsed

// Setting displayed message for having prepared enough food.
export let finalMessage =
  $.dryFoodRemaining >= 0 && $.wetFoodRemaining >= 0 ? (
    <p>
      <strong>✅ Great job, you fed all the neighborhood cats!</strong>
    </p>
  ) : (
    <p>
      <strong>
        ❌ Looks like we need more food! Some cats are still hungry...
      </strong>
    </p>
  );

export default (
  <div>
    <p>{finalMessage}</p>
  </div>
);
```

<strong>Go ahead, play with the inputs above to adjust how much food to prepare!</strong>

These are just 2 of the many input types that TypeCell supports. To see the
other choices, make sure to try the TypeCell inputs tutorial.

_<strong>Tip:</strong> expand the 3 cells above to see how they work._

## Final notes

We hope this introduction has given you a sense of how TypeCell Codebooks and
reactive notebooks work.

The live feedback and Reactive programming model should be pretty powerful.
There are a lot more features to discover, for example,
did you know you can import any NPM package you like, or even compose different notebooks?
Try creating your own notebook to give it a try, or have a look at the other examples.

**Have fun using TypeCell Codebooks!**

<small>This tutorial is inspired by [pluto.jl](https://github.com/fonsp/Pluto.jl), thanks Fons & Nicholas!</small>
