/* eslint-disable @typescript-eslint/no-explicit-any */
import { IObservableValue } from "mobx";
import * as React from "react";

export type ReactView<T> = React.ReactElement<{
  __tcObservable: T; // actually IObservableValue<T>, but this breaks the type resolving in setupTypecellTypeResolver:addHelperFiles
}>;

export function isReactView(value: any): value is ReactView<any> {
  return React.isValidElement<any>(value) && value.props.__tcObservable;
}

export function getReactViewValue<T>(value: ReactView<T>): IObservableValue<T> {
  return value.props.__tcObservable as any;
}

// Below type helpers are in setupTypecellTypeResolver:addHelperFiles

// type x = {
//   bla: number;
//   t: ReactView<string>;
// };

// export type OnlyViews<T> = {
//   // [E in keyof T as T[E] extends ReactView<any> ? E : never]: T[E];
//   [E in keyof T]: T[E] extends ReactView<any> ? T[E] : never;
// };

// export type Values<T> = {
//   [E in keyof T]: T[E] extends ReactView<infer B> ? B : T[E];
// };
