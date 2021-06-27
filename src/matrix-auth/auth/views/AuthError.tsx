/*
Copyright 2019 New Vector Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React from "react";
import { N40 } from "@atlaskit/theme/colors";

export const AuthError = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      style={{
        position: "relative",
        border: `1px solid ${N40}`,
        boxShadow:
          "0px 4px 8px rgba(9, 30, 66, 0.25), 0px 0px 1px rgba(9, 30, 66, 0.31)",
        borderRadius: 4,
        maxWidth: 500,
        margin: "16px auto",
      }}>
      {children}
    </div>
  );
};

export default AuthError;
