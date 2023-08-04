/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { getReactViewValue } from "@typecell-org/engine";
import { IObservableValue, isObservable, observable } from "mobx";
import * as React from "react";
import ReactViewElement from "./ReactViewElement";

// same as ReactView from typecell-org/engine, but define here so we don't import all types at runtime
type TypeCellView<T> = React.ReactElement<{
  __tcObservable: T;
}>;

type TextAreaType = React.ReactElement<
  React.DetailedHTMLProps<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    HTMLTextAreaElement
  >
>;

type SelectType = React.ReactElement<
  React.DetailedHTMLProps<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    HTMLSelectElement
  >
>;

type InputType = React.ReactElement<
  React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >
>;

export function Input<T extends string | string[] | number = string>(
  el: TextAreaType | SelectType | InputType,
  bindingOrDefaultValue?: T | TypeCellView<T>
): TypeCellView<T extends string ? string : T> {
  // don't use string literals
  if (el.type !== "input" && el.type !== "select" && el.type !== "textarea") {
    throw new Error("invalid element passed");
  }

  if (
    // @ts-ignore
    el.props.checked !== undefined ||
    el.props.defaultChecked !== undefined ||
    el.props.defaultValue !== undefined ||
    el.props.onChange !== undefined
  ) {
    throw new Error(
      "invalid, don't set checked / defaultChecked / defaultValue / onChange on input"
    );
  }

  let val: IObservableValue<T> = bindingOrDefaultValue as any;

  if (React.isValidElement<any>(val)) {
    val = getReactViewValue(val);
    if (!isObservable(val)) {
      throw new Error("invalid defaultValue passed");
    }
  }

  if (!isObservable(val)) {
    if (
      // @ts-ignore
      (el.type === "select" && el.props.multiple) ||
      // @ts-ignore
      (el.type === "input" && el.props.type === "checkbox")
    ) {
      if (val !== undefined && !Array.isArray(val)) {
        throw new Error("invalid default value");
      }
      val = observable.box(val === undefined ? [] : val) as any;
    } else if (
      el.type === "input" &&
      // @ts-ignore
      (el.props.type === "number" || el.props.type === "range")
    ) {
      if (val !== undefined && typeof val !== "number") {
        throw new Error("invalid default value");
      }
      let defaultVal = 0;
      const { min, max } = el.props as any;
      if (min) {
        if (max) {
          defaultVal = Math.floor((parseFloat(min) + parseFloat(max)) / 2);
        } else {
          defaultVal = parseFloat(min);
        }
      }
      val = observable.box(val === undefined ? defaultVal : val) as any;
    } else if (el.type === "select") {
      if (typeof val !== "string") {
        throw new Error(
          "must pass default value to select (or set multiple={true})"
        );
      }
      val = observable.box(val);
    } else {
      val = observable.box(val === undefined ? "" : val) as any;
    }
  }

  const element = (
    <ReactViewElement __type={el.type} {...el.props} __tcObservable={val} />
  );

  return element;
}

export default Input;
