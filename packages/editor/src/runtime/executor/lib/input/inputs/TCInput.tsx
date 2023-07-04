import { getReactViewValue } from "@typecell-org/engine";
import { IObservableValue, isObservable, observable } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";

type ReactInputProps = React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>;

const ReactViewComponent = <
  T extends string | string[] | number,
  P extends {
    binding: T;
  }
>(
  fc: React.FC<P>
) => {
  type NewComponentType = React.FC<Omit<P, "__tcObservable"> & { binding?: T }>;
  return fc as NewComponentType;
};

type Props = Omit<
  ReactInputProps,
  "checked" | "defaultChecked" | "defaultValue" | "onChange"
> & {
  binding: any;
  defaultValue?: any;
};

export const TCInput = ReactViewComponent<string, Props>((props) => {
  if (
    (props as any).checked !== undefined ||
    (props as any).defaultChecked !== undefined ||
    (props as any).defaultValue !== undefined ||
    (props as any).onChange !== undefined
  ) {
    throw new Error(
      "invalid, don't set checked / defaultChecked / defaultValue / onChange on TCInput"
    );
  }

  if (props.defaultValue && props.binding) {
    throw new Error(
      "invalid, don't set both defaultValue and binding on TCInput"
    );
  }

  let val: IObservableValue<any>;

  if (props.binding) {
    if (React.isValidElement(props.binding)) {
      val = getReactViewValue(props.binding as any);
    } else {
      val = props.binding;
    }

    if (!isObservable(val)) {
      throw new Error("invalid binding passed");
    }
  }

  if (props.defaultValue) {
    val = observable.box(props.defaultValue);
  } else {
    val = observable.box("") as any; // TODO
  }

  //   return (
  //     <input
  //       {...props}
  //       onChange={(e: any) => {
  //         debugger;
  //         val.set(e.target.value);
  //       }}
  //       value={val.get()}
  //       // @ts-expect-error
  //       __tcObservable={val}
  //     />
  //   );
  return <InternalInput {...props} __tcObservable={val} __type="input" />;
});

export const InternalInput = observer(
  (props: any & { __tcObservable: any }) => {
    return (
      <input
        {...props}
        onChange={(e: any) => {
          //   debugger;
          props.__tcObservable.set(e.target.value);
        }}
        value={props.__tcObservable.get()}

        // __tcObservable={val}
      />
    );
  }
);

// export let x = <Slider defaultValue={1} />;

// export let x = <Map location={{lat: 4, lon: 2}} />;

// Insert a map
// <Map location={{lat: 4, lon: 2}} />

// Edit map:
// shows form
//
