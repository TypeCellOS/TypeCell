import type {
  Annotation,
  ObservableObjectAdministration,
} from "mobx/dist/internal";
import { observable, $mobx } from "mobx";
import React from "react";

const defaultAnnotation = (observable({}) as any)[$mobx].defaultAnnotation_;

export const customAnnotation: Annotation = createCustomAnnotation();

/**
 * A custom annotation that never deep observes react elements,
 * so that we can still pass react elements around on the observablecontext
 * (if we'd deep observe react elements, it will break React and even if it wouldn't break, would
 *  cause unnecessary perf overhead)
 */
export function createCustomAnnotation(options?: object): Annotation {
  return {
    annotationType_: "custom",
    options_: options,
    make_: function (
      this: any,
      adm: ObservableObjectAdministration,
      key: PropertyKey,
      descriptor: PropertyDescriptor,
      source: object
    ) {
      return defaultAnnotation.make_.call(this, adm, key, descriptor, source);
    } as any,
    extend_: function (
      this: any,
      adm: ObservableObjectAdministration,
      key: PropertyKey,
      descriptor: PropertyDescriptor,
      proxyTrap: boolean
    ) {
      if (React.isValidElement(descriptor.value)) {
        return observable.ref.extend_(adm, key, descriptor, proxyTrap);
      } else if (typeof descriptor.value === "function") {
        // don't create mobx actions
        return observable.ref.extend_(adm, key, descriptor, proxyTrap);
      } else {
        return defaultAnnotation.extend_.call(
          this,
          adm,
          key,
          descriptor,
          proxyTrap
        );
      }
    } as any,
  };
}

let hooked = false;

/**
 * Modify observable.object to intercept all mobx initializers to use our customAnnotation by default
 */
export function hookDefaultAnnotation() {
  if (hooked) {
    throw new Error("already hooked");
  }
  hooked = true;
  let oldObject = observable.object;
  observable.object = (props, decorators, options) => {
    if (!options) {
      options = {
        defaultDecorator: customAnnotation,
      } as any;
    } else if (!options.defaultDecorator) {
      options.defaultDecorator = customAnnotation;
    }
    return oldObject(props, decorators, options);
  };
}
