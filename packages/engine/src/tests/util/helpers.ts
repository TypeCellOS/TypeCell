import { CodeModel } from "../../CodeModel.js";
import { ResolvedImport } from "../../ReactiveEngine.js";
import { CodeModelMock } from "./CodeModelMock.js";

export function waitTillEvent<T>(
  e: (listener: (arg0: T) => void) => void,
  expected: number
): Promise<T[]> {
  const captured: T[] = [];
  return new Promise((resolve) => {
    e(({ ...args }) => {
      if (captured.length < expected) {
        captured.push(args);
      }
      if (captured.length === expected) {
        return resolve(captured);
      }
    });
  });
}

export async function importResolver(
  _module: string,
  _forModel: CodeModel
): Promise<ResolvedImport> {
  const res = async () => {
    return {
      module: {
        default: {},
      },
      dispose: () => {},
    };
  };

  return res();
}

export function toAMDFormat(code: string) {
  return `define(["require", "exports"], function(require, exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      ${code}
      });
      `;
}

export function buildMockedModel(name: string, code: string) {
  return new CodeModelMock("javascript", name, toAMDFormat(code));
}
