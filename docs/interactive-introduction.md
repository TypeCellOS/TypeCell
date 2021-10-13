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
// E.g. dryFoodToPrepare is the sum of cansPerWeek across neighbors where prefersDryFood is true.
let dryFoodToPrepare = 0;
let wetFoodToPrepare = 0;

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

Next, we'll use an range slider to indicate how many cans we have prepared.
The built-in TypeCell Input library makes this extremely easy:


```typescript
// Slider input
let dryFoodPrepared = typecell.Input<number>(
  <input type="range" min="0" max="20" />,
  0
);

// Number input
let wetFoodPrepared = typecell.Input<number>(
  <input type="number" min="0" max="20" />,
  0
);

export let inputs = (
  <div>
    <div>Dry food packs prepared: {dryFoodPrepared}</div>
    <div>Wet food packs prepared: {wetFoodPrepared}</div>
  </div>
);

```

Now, you can play with the range above,
and see whether we have prepared enough cans of food below!

*Expand the cell below to see how it works*


```typescript
// @default-collapsed

const dryFoodRemaining = $.numberOfCansPrepared - $.cansToPrepare;

let message = (
  <strong>
    Sweet! We prepared just enough food, the cats have eaten all the cans!
  </strong>
);

if (cansRemaining < 0) {
  message = (
    <strong>
      Oh no! We haven't prepared enough food. Move the slider up or remove some
      cats!
    </strong>
  );
} else if (cansRemaining > 0) {
  message = (
    <strong>
      Yummie!! The cats have eaten some cans and we still have {cansRemaining}{" "}
      cans left: {$.repeat("🥫", cansRemaining)}
    </strong>
  );
}

export default message;

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
