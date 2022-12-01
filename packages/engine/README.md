# packages/engine

The Reactive Runtime responsible for evaluating user cells, exported as `@typecell-org/engine`.

## Engine

The TypeCell Reactive Runtime is built on top of MobX.

The engine (`Engine.ts`) automatically runs models registered to it. The code of the models is passed an observable context ($) provided by the engine. This context is how the code of different models can react to each other.

## Resolvers

The `src/resolver` directory contains the logic to load third party NPM modules using esm.sh (or fallback to skypack / jspm).
