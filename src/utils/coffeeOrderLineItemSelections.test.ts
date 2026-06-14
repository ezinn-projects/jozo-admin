import { describe, expect, it } from "vitest";
import {
  selectionsToState,
  stateToSelections,
  validateSelectionState,
} from "./coffeeOrderLineItemSelections";
import { FnBMenuCustomizationGroup } from "@/@types/FnBCustomization";

const groups: FnBMenuCustomizationGroup[] = [
  {
    groupKey: "size",
    label: "Size",
    minSelect: 1,
    maxSelect: 1,
    options: [
      { optionKey: "m", label: "M" },
      { optionKey: "l", label: "L", priceDelta: 5000 },
    ],
  },
  {
    groupKey: "topping",
    label: "Topping",
    minSelect: 0,
    maxSelect: 2,
    options: [
      { optionKey: "pearl", label: "Trân châu" },
      { optionKey: "jelly", label: "Thạch" },
    ],
  },
];

describe("coffeeOrderLineItemSelections editor helpers", () => {
  it("chuyển selections sang state và ngược lại", () => {
    const state = selectionsToState([
      { groupKey: "size", optionKey: "m" },
      { groupKey: "topping", optionKey: "pearl" },
    ]);

    expect(state).toEqual({
      size: ["m"],
      topping: ["pearl"],
    });

    expect(stateToSelections(state, groups)).toEqual([
      { groupKey: "size", optionKey: "m" },
      { groupKey: "topping", optionKey: "pearl" },
    ]);
  });

  it("báo lỗi khi thiếu nhóm bắt buộc", () => {
    const validation = validateSelectionState(
      { topping: ["pearl"] },
      groups,
    );

    expect(validation.valid).toBe(false);
    expect(validation.errors[0]).toContain("Size");
  });

  it("báo lỗi khi chọn quá maxSelect", () => {
    const validation = validateSelectionState(
      {
        size: ["m"],
        topping: ["pearl", "jelly", "pearl"],
      },
      groups,
    );

    expect(validation.valid).toBe(false);
    expect(validation.errors[0]).toContain("Topping");
  });
});
