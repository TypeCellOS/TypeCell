import { Stored } from "./stored.js";

export type Storage = {
  hasStoredValue: (propertyName: string) => boolean;
  removeStoredValue: (propertyName: string) => void;
  addStoredValue: (propertyName: string, storedValue: Stored) => void;
  getSubStorage: (module: string) => Storage;
  [prop: string]: any;
};
