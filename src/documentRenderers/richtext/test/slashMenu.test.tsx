import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import RichTextRenderer from "../RichTextRenderer";

// test("Typing slash opens the slash menu", async () => {
//   render(
//     <div>
//       <RichTextRenderer document={null} />
//     </div>
//   );
// });

/// We could probably mock the y.js. We'll start by disabling collaboration and writing
/// valid tests. If everything goes well we can try to reintroduce collaboration.

test("Typing slash opens the slash menu", async () => {
  render(
    <div>
      <RichTextRenderer content={"<p>Hello World!</p>"} />
    </div>
  );
  screen.debug();
});

// test("Typing slash opens the slash menu", async () => {

// }
