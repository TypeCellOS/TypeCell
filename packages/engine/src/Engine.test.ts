import { CodeModel } from "./CodeModel";
import { Engine } from "./Engine";
import { event } from "vscode-lib";
import {
  buildMockedModel,
  importResolver,
  toAMDFormat,
  waitTillEvent,
} from "./tests/util/helpers";
import { CodeModelMock } from "./tests/util/CodeModelMock";

describe("engine class execution", function () {
  describe("basic model execution", () => {
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

    it("should execute a single model", async () => {
      const engine = new Engine<CodeModel>(importResolver);
      engine.registerModel(getModel1());

      const { model, output } = await event.Event.toPromise(engine.onOutput);

      expect(model.path).toBe("model1");
      expect(output.sum).toBe(10);
      expect(output.default).toBe(10);
    });

    it("should read exported variables from other models", async () => {
      const engine = new Engine<CodeModel>(importResolver);
      engine.registerModel(getModel1());
      await event.Event.toPromise(engine.onOutput);

      engine.registerModel(getModel2());
      const { model, output } = await event.Event.toPromise(engine.onOutput);

      expect(model.path).toBe("model2");
      expect(output.default).toBe(5);
    });

    it("should re-evaluate code after change", async () => {
      const engine = new Engine<CodeModel>(importResolver);
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
      const engine = new Engine<CodeModel>(importResolver);
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

  describe("console messages", () => {
    const getModel1 = () => buildMockedModel("model1", `console.log('hi!');`);
    const getModel2 = () =>
      buildMockedModel(
        "model2",
        `console.info('info'); console.warn('warn'); console.error('error');`
      );
    const getModel3 = () =>
      buildMockedModel(
        "model3",
        `console.log('before');
        await new Promise((resolve)=> {
          setTimeout(()=> {
            resolve();
          }, 1)
        });
        console.log('after');`
      );
    const getModel4 = () =>
      new CodeModelMock(
        "javascript",
        "model4",
        `define(["require", "exports", "logdown"], function(require, exports, logdown) {
          "use strict";
          Object.defineProperty(exports, "__esModule", { value: true });         
        
          let logger = logdown("logger 1");
          logger.state.isEnabled = true;
          logger.log("message 1");

          setTimeout(() => {
            logger.state.isEnabled = true;
            logger.log("message 2");
          }, 1);
        });`
      );

    it("should capture console.log message", async () => {
      const engine = new Engine<CodeModel>(importResolver);
      const eventsPromise = waitTillEvent(engine.onConsole, 1);
      const model1 = getModel1();

      engine.registerModel(model1);

      const consoleEvents = await eventsPromise;

      expect(consoleEvents[0].payload.level).toBe("info");
      expect(consoleEvents[0].payload.message[0]).toBe("hi!");
    });

    it("should capture console.warn/info/error messages", async () => {
      const engine = new Engine<CodeModel>(importResolver);
      const eventsPromise = waitTillEvent(engine.onConsole, 3);
      const model2 = getModel2();

      engine.registerModel(model2);

      const events = await eventsPromise;
      const eventsSnapshot = events.map((event) => {
        return {
          path: event.model.path,
          console: event.payload,
        };
      });
      expect(eventsSnapshot).toMatchSnapshot();
    });

    it("should capture console.log messages after async", async () => {
      const engine = new Engine<CodeModel>(importResolver);
      const eventsPromise = waitTillEvent(engine.onConsole, 2);
      const model3 = getModel3();

      engine.registerModel(model3);

      const events = await eventsPromise;
      expect(events[0].payload.message[0]).toBe("before");
      expect(events[1].payload.message[0]).toBe("after");
    });

    it("should capture console.log messages from library (sync only)", async () => {
      const engine = new Engine<CodeModel>(importResolver);
      const eventsPromise = waitTillEvent(engine.onConsole, 2);
      const model4 = getModel4();

      engine.registerModel(model4);

      const events = await eventsPromise;
      expect(events[0].payload.message[1]).toBe("message 1");
      expect(events[1].payload.message[1]).toBe("message 2");
    });
  });
});
