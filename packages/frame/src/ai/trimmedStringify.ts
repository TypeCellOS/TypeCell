import React from "react";

// quickly generated with chatgpt:
// "create a json stringify alternative that can trim long fields / deeply nested objects,
// and serializes property getters"

// https://chat.openai.com/share/693c349f-3f74-4913-8f1d-ba4477f93e87

type Serializable =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Serializable }
  | Serializable[];

interface QueueItem {
  obj: Serializable;
  path: (string | number)[];
}

/**
 * a stringify function that trims long fields / deeply nested objects, and serializes property getters
 */
export function trimmedStringify(obj: Serializable, budget = 1000): string {
  const seen = new Set<Serializable>();
  const queue: QueueItem[] = [{ obj, path: [] }];
  const output: Serializable = Array.isArray(obj) ? [] : {};

  while (queue.length > 0 && budget > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { obj: currentObj, path } = queue.shift()!;

    if (typeof currentObj !== "object" || currentObj === null) {
      continue;
    }

    // Handle circular references
    if (seen.has(currentObj)) {
      setByPath(output, path, "[CIRCULAR]");
      continue;
    }
    seen.add(currentObj);

    for (const key in currentObj) {
      if (budget <= 0) {
        break;
      }

      const value = (currentObj as any)[key];
      const newPath = path.concat(key);

      if (typeof value === "string") {
        if (value.length <= budget) {
          setByPath(output, newPath, value);
          budget -= value.length;
        } else {
          setByPath(
            output,
            newPath,
            value.substring(0, budget - "[TRIMMED]".length) + "[TRIMMED]",
          );
          budget = 0;
        }
      } else if (typeof value === "object" && value !== null) {
        if (Array.isArray(value)) {
          const newValue: Serializable[] = [];
          setByPath(output, newPath, newValue);
          if (JSON.stringify(value).length > budget) {
            newValue.push("[TRIMMEDARRAY]");
            budget -= "[TRIMMEDARRAY]".length;
          } else {
            queue.push({ obj: value, path: newPath });
          }
        } else if (React.isValidElement(value)) {
          setByPath(output, newPath, "[REACTELEMENT]");
        } else {
          const newValue: Serializable = {};
          setByPath(output, newPath, newValue);
          if (JSON.stringify(value).length > budget) {
            for (const prop in newValue) {
              delete newValue[prop];
            }
            setByPath(output, newPath, "[TRIMMEDOBJECT]");
            budget -= "[TRIMMEDOBJECT]".length;
          } else {
            queue.push({ obj: value, path: newPath });
          }
        }
      } else {
        setByPath(output, newPath, value);
      }
    }
  }

  return JSON.stringify(output);

  function setByPath(
    obj: Serializable,
    path: (string | number)[],
    value: Serializable,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = obj; // We'll refine this with type assertions as we traverse
    for (let i = 0; i < path.length - 1; i++) {
      if (typeof current[path[i]] === "undefined") {
        current[path[i]] = typeof path[i + 1] === "number" ? [] : {};
      }
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
  }
}

// Example usage:
// const obj = {
//   name: "John",
//   details: {
//     age: 25,
//     address: {
//       street: "123 Main St",
//       city: "Anytown",
//       state: "CA",
//       country: {
//         name: "USA",
//         code: "US",
//         continent: {
//           name: "North America",
//           code: "NA",
//         },
//       },
//     },
//   },
//   hobbies: ["reading", "traveling", "swimming", "hiking", "cycling"],
//   bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
//   get fullName() {
//     return this.name + " Doe";
//   },
// };

// console.log(customStringify(obj, 200));
