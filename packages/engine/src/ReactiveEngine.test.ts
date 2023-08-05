import { CodeModel } from "@typecell-org/shared";
import { describe, expect, it } from "vitest";
import { event } from "vscode-lib";
import { ReactiveEngine } from "./ReactiveEngine.js";
import {
  buildMockedModel,
  importResolver,
  toAMDFormat,
  waitTillEvent,
} from "./tests/util/helpers.js";

/**
 * @vitest-environment jsdom
 */

const getModel1 = () =>
  buildMockedModel(
    "model1",
    `let x = 4; 
let y = 6; 
let sum = x + y;
exports.sum = sum;
exports.default = sum;`
  );

const getModel2 = () =>
  buildMockedModel("model2", `exports.default = $.sum - 5;`);

describe("ReactiveEngine class", () => {
  it("should execute a single model", async () => {
    const engine = new ReactiveEngine<CodeModel>(importResolver);
    engine.registerModel(getModel1());

    const { model, output } = await event.Event.toPromise(engine.onOutput);

    expect(model.path).toBe("model1");
    expect(output.sum).toBe(10);
    expect(output.default).toBe(10);
  });

  it("should read exported variables from other models", async () => {
    const engine = new ReactiveEngine<CodeModel>(importResolver);
    engine.registerModel(getModel1());
    await event.Event.toPromise(engine.onOutput);

    engine.registerModel(getModel2());
    const { model, output } = await event.Event.toPromise(engine.onOutput);

    expect(model.path).toBe("model2");
    expect(output.default).toBe(5);
  });

  it("should re-evaluate code after change", async () => {
    const engine = new ReactiveEngine<CodeModel>(importResolver);
    const model1 = getModel1();

    engine.registerModel(model1);
    await event.Event.toPromise(engine.onOutput);

    model1.updateCode(
      toAMDFormat(`let x = 0;
    let y = 6;
    let sum = x + y;
    exports.sum = sum;
    exports.default = sum;`)
    );

    const { output } = await event.Event.toPromise(engine.onOutput);

    expect(output.sum).toBe(6);
    expect(output.default).toBe(6);
  });

  it("should re-evaluate other models when global variable changes", async () => {
    const engine = new ReactiveEngine<CodeModel>(importResolver);
    // TODO: Expected 4 events. Figure out why model 2 re-evaluates.
    const eventsPromise = waitTillEvent(engine.onOutput, 5);
    const model1 = getModel1();
    const model2 = getModel2();

    engine.registerModel(model1);
    engine.registerModel(model2);

    model1.updateCode(
      toAMDFormat(`let x = 0;
    let y = 6;
    let sum = x + y;
    exports.sum = sum;
    exports.default = sum;`)
    );

    const events = await eventsPromise;
    const eventsSnapshot = events.map((event) => ({
      path: event.model.path,
      output: event.output,
    }));
    const finalEvent = eventsSnapshot[eventsSnapshot.length - 1];

    expect(finalEvent.path).toBe("model2");
    expect(finalEvent.output.default).toBe(1);
    expect(eventsSnapshot).toMatchSnapshot();
  });
});
