# Introduction to TypeCell Codebooks

Welcome to TypeCell Codebooks. A codebook is a live, interactive programming environment for Javascript / Typescript
running in your browser.

In this introduction, we will go through the basics of using TypeCell Codebooks.

## Cats

Let's say you're like my grandma, and you have a lot of cats. Our story will be about them.


```typescript
export let cat = { name: "@2sd##$" };

```

```typescript
// @default-collapsed

// Notice how exported variables are made available under the $-sign.
export default $.cat.name.match(/^[a-zA-Z0-9\s]+$/) ? (
  <div>
    <strong>Well done, your cat is called {$.cat.name} now.</strong> This text
    gets updated every time you change the name -{" "}
    <em>instantly, as you type</em>. To see how the magic works, click on the
    arrow (&rsaquo;) to the left of this text.
  </div>
) : (
  <div>
    Oh no! Someone messed with my pretty introduction. Change the code above to
    give our cat a proper name (without special characters)!
  </div>
);

```

```typescript
export default (
  <div>I feel like our cat needs a friend. Let's call him {$.friend.name}</div>
);

```

Uh oh, what's this? I forgot to add a cell defining our friend. Can you do it for me?

A cell is a container for code & output. To add one, click on the + above or below another cell.
You can do it wherever you like.

## Feeding neighbors

Our cats have some neighbors. Let's involve them in the story too!


```typescript
export let neighbors = [
  $.cat,
  $.friend,
  { name: "Smerfetka" },
  { name: "Latte" },
];

```

Now, if you're like my grandma, you're feeding the entire neighborhood by yourself.
Let's see how many cans of food you need to prepare.


```typescript
export function repeat(char: string, times: number) {
  let completeString = "";
  for (let i = 0; i < times; i++) {
    completeString += char;
  }
  return completeString;
}

// A number indicating the number of cans to prepare
// (basically, the number of cats in $.neighbors)
export const cansToPrepare = $.neighbors.filter(
  (cat) => cat !== undefined
).length;

const cansAsString = repeat("🥫", cansToPrepare);

// Note:
// - How we're using JSX to render output
// - A "default" export indicates
//   how to display the output of the cell
export default <div>Cans to prepare for the cats: {cansAsString}</div>;

```

We have now stored the number of cans required under `$.cansToPrepare`.
Notice how we're using React / JSX in combination with a `default` export to
make the display of a cell more meaningful to the user.

Next, we'll use an range slider to indicate how many cans we have prepared.
The built-in TypeCell Input library makes this extremely easy:


```typescript
export let numberOfCansPrepared = typecell.Input<number>(
  <input type="range" min={0} max={10} />,
  0
);

```

```typescript
// @default-collapsed

export default <p>Number of cans prepared: {$.numberOfCansPrepared}.</p>;

```

Now, you can play with the range above,
and see whether we have prepared enough cans of food below!

*Expand the cell below to see how it works*


```typescript
// @default-collapsed

const cansRemaining = $.numberOfCansPrepared - $.cansToPrepare;

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
