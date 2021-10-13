# Introduction to TypeCell Codebooks

Welcome to TypeCell Codebooks. A codebook is a live, interactive programming environment for Javascript / Typescript
running in your browser.

In this introduction, we will go through the basics of using TypeCell Codebooks.

## Cats

Let's say you're like my grandma, and you have a lot of cats. Our story will be about them.


```typescript
export let cat = {
  name: "1",
  prefersDryFood: false,
  foodPerWeek: 4,
};

```

```typescript
// @default-collapsed

let message;

// Notice how exported variables are made available under the $-sign.
if ($.cat.name === "") {
  message = (
    <div>
      Give your cat a name! Try changing the "name" field in the code above.
    </div>
  );
} else if (!$.cat.name.match(/^[a-zA-Z0-9\s]+$/)) {
  message = (
    <div>
      Oh no! Someone messed with my pretty introduction. Change the code above
      to give our cat a proper name (without special characters)!
    </div>
  );
} else {
  message = (
    <div>
      <strong>Well done, your cat is called {$.cat.name} now.</strong> This text
      gets updated every time you change the name -{" "}
      <em>instantly, as you type</em>. To see how the magic works, click on the
      arrow (&rsaquo;) to the left of this text.
    </div>
  );
}

export default message;

```

```typescript
export default (
  <div>I feel like our cat needs a friend. Let's call him {$.friend.name}.</div>
);

```

```typescript
export let friend = {
  name: "2",
  prefersDryFood: true,
  foodPerWeek: 3,
};

```

Uh oh, what's this? I forgot to add a cell defining our friend. Can you do it for me?

A cell is a container for code & output. To add one, click on the + above or below another cell.
You can do it wherever you like.

<strong>Hint:</strong> Our friend only needs a name for now. Use the same structure as you already
used for your cat, but only include the `name` field.

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
yet know if our friend prefers dry/wet food or how many cans they eat per week. Go ahead and add
the `prefersDryFood` and `foodPerWeek` fields to our friend that we defined earlier!

Once you've done that, let's see how much food you need to prepare.


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
  if ($.neighbors[i] !== undefined && "foodPerWeek" in $.neighbors[i]) {
    $.neighbors[i].prefersDryFood
      ? (dryFoodToPrepare += $.neighbors[i].foodPerWeek)
      : (wetFoodToPrepare += $.neighbors[i].foodPerWeek);
  }
}

const dryFoodAsString = repeat("🍱", dryFoodToPrepare);
const wetFoodAsString = repeat("🥫", wetFoodToPrepare);

// Note:
// - How we're using JSX to render output
// - A "default" export indicates how to display the output of the cell
export default (
  <div>
    <div>Dry food packs to prepare for the cats: {dryFoodAsString}.</div>
    <div>Wet food cans to prepare for the cats: {wetFoodAsString}.</div>
  </div>
);

```

We have now stored the number of cans required under `$.cansToPrepare`.
Notice how we're using React / JSX in combination with a `default` export to
make the display of a cell more meaningful to the user.

Next, we'll create some user input fields to indicate how much food we have prepared.
The built-in TypeCell Input library makes this extremely easy:


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

Now, you can play with the range above to set how much dry food you want to
prepare, while the number input can be used to set how much wet food you want
to prepare!

Feel free to play around with the range and number field until we have enough
food to feed all the neighborhood cats.

These are just 2 of the many input types that TypeCell supports. To see the
other choices, make sure to visit try the TypeCell inputs tutorial!

*Expand the cells below to see how they work*


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
      <strong>Great job, you fed all the neighborhood cats!</strong>
    </p>
  ) : (
    <p>
      <strong>
        Looks like we need more food! Some cats are still hungry...
      </strong>
    </p>
  );

export default (
  <div>
    <p>{finalMessage}</p>
  </div>
);

```

## Final notes

We hope this introduction has given you a sense of how TypeCell Codebooks and
reactive notebooks work.

The live feedback and Reactive programming model should be pretty powerful.
There are a lot more features to discover, for example,
did you know you can import any NPM package you like, or even compose different notebooks?
Try creating your own notebook to give it a try, or have a look at the other examples.

**Have fun using TypeCell Codebooks!**

<small>This tutorial is inspired by [pluto.jl](https://github.com/fonsp/Pluto.jl), thanks Fons & Nicholas!</small>
