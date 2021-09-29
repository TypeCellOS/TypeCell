import React from "react";
import { lifecycle } from "vscode-lib";
import { TypeCellCodeModel } from "../../../models/TypeCellCodeModel";

export type ExecutionHost = lifecycle.IDisposable & {
  renderContainer(): React.ReactElement;

  renderOutput(
    model: TypeCellCodeModel,
    setHovering?: (hover: boolean) => void
  ): React.ReactElement;
};
