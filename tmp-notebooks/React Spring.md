# React Spring demo

Some examples of animations using `react-spring`. The demos come from https://react-spring.io/basics.


```typescript
import { useSpring, animated } from "react-spring";
import { useState } from "react";

function Text() {
  const [flip, set] = useState(false);
  const props = useSpring({
    to: { opacity: 1 },
    from: { opacity: 0 },
    reset: true,
    reverse: flip,
    delay: 200,
    onRest: () => set(!flip),
  });

  return <animated.h1 style={props}>hello</animated.h1>;
}

export default <Text />;

```

```typescript
import { useSpring, animated } from "react-spring";
import { useState } from "react";

function Number() {
  const [flip, set] = useState(false);
  const { number } = useSpring({
    reset: true,
    reverse: flip,
    from: { number: 0 },
    number: 1,
    delay: 200,
    onRest: () => set(!flip),
  });

  return <animated.div>{number.to((n: number) => n.toFixed(2))}</animated.div>;
}

export default <Number />;

```

## Parallax demo:

See original @ https://react-spring.io/components/parallax.


```typescript
import { Parallax, ParallaxLayer } from "@react-spring/parallax";

export default (
  <div style={{width:"100%"; height:400, position:"relative"}}>
    <Parallax pages={2} style={{ top: "0", left: "0" }}>
      <ParallaxLayer
        offset={0}
        speed={2.5}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}>
        <p>Scroll down</p>
      </ParallaxLayer>

      <ParallaxLayer
        offset={1}
        speed={2}
        style={{ backgroundColor: "#ff6d6d" }}
      />

      <ParallaxLayer
        offset={1}
        speed={0.5}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
        }}>
        <p>Scroll up</p>
      </ParallaxLayer>
    </Parallax>
  </div>
);
```