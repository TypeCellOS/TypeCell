import { IObservableValue } from "mobx";
import * as React from "react";

export type ReactView<T> = React.ReactElement<{
  __tcObservable: IObservableValue<T>;
}>;

export function isReactView(value: any): value is ReactView<any> {
  return React.isValidElement<any>(value) && value.props.__tcObservable;
}

export function getReactViewValue<T>(value: ReactView<T>): IObservableValue<T> {
  return value.props.__tcObservable;
}

// type x = {
//   bla: number;
//   t: ReactView<string>;
// };

type FilteredKeys<T, U> = {
  [P in keyof T]: T[P] extends U ? P : never;
}[keyof T];

type OnlyViews<T> = {
  [E in FilteredKeys<T, ReactView<any>>]: T[E] extends ReactView<any>
    ? T[E]
    : never;
};

type Values<T> = {
  [E in keyof T]: T[E] extends ReactView<infer B> ? B : T[E];
};
