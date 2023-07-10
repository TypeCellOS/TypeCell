import { observer } from "mobx-react-lite";
import React from "react";

export const ReactViewElement = observer(
  (props: any & { __tcObservable: any; __type: string }) => {
    const { __tcObservable, __type, ...elementProps } = props;

    if (props.__type === "input" && elementProps.type === "radio") {
      return React.createElement(__type, {
        ...elementProps,
        onChange: (e: any) => {
          __tcObservable.set(e.target.value);
        },
        checked: __tcObservable.get() === elementProps.value,
      });
    } else if (props.__type === "input" && elementProps.type === "checkbox") {
      return React.createElement(__type, {
        ...elementProps,
        checked: __tcObservable.get().includes(elementProps.value),
        onChange: (e: any) => {
          if (e.target.checked) {
            if (!__tcObservable.get().includes(elementProps.value)) {
              __tcObservable.get().push(elementProps.value);
            }
          } else {
            __tcObservable.set(
              __tcObservable.get().filter((v: any) => v !== elementProps.value)
            );
          }
        },
      });
    } else if (
      (props.__type === "input" &&
        (props.type === "text" ||
          props.type === "email" ||
          props.type === "url" ||
          !props.type)) ||
      props.__type === "textarea"
    ) {
      return React.createElement(__type, {
        ...elementProps,
        onChange: (e: any) => {
          __tcObservable.set(e.target.value);
        },
        value: __tcObservable.get(),
      });
    } else if (
      props.__type === "input" &&
      (props.type === "number" || props.type === "range")
    ) {
      return React.createElement(__type, {
        ...elementProps,
        onChange: (e: any) => {
          __tcObservable.set(parseFloat(e.target.value));
        },
        value: __tcObservable.get(),
      });
    } else if (props.__type === "select") {
      return React.createElement(__type, {
        ...elementProps,
        onChange: (e: any) => {
          __tcObservable.set(
            Array.from(e.target.selectedOptions, (option: any) => option.value)
          );
        },
        value: __tcObservable.get(),
      });
    } else {
      return React.createElement(__type, {
        ...elementProps,
        // onChange: (e: any) => {
        //   __tcObservable.set(
        //     Array.from(e.target.selectedOptions, (option: any) => option.value)
        //   );
        // },
        // value: __tcObservable.get(),
      });
    }
  }
);

export default ReactViewElement;

// export let val = 0;
// ---
// const el = document.createElement("span");

// new scrubber(el, {
//   adapter: {
//     change: (value) => {
//       $.val = 0
//     }
//   }
// })

// export default view(el, )

// let x = view(() => {
//   const el = document.createElement("span");

//   new scrubber(el, {
//     adapter: {
//       change: (value) => {
//         b.set(value)
//       }
//     }
//   })

//   return el;
// }, 5)

// export let x = <ScrubberView defaultValue={4} />

// function ScrubberView(props: { defaultValue: number }) {

//   const b = useObservable(props.defaultValue)

//   const el = document.createElement("span");

//   new scrubber(el, {
//     adapter: {
//       change: (value) => {
//         b.set(value)
//       }
//     }
//   })

//   return <span ref={el}>{b.get()}</span>;
// }
