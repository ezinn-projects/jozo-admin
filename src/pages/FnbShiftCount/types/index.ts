import type {
  IFnbShiftCountLine,
  IFnbShiftCountReportItem,
  IFnbShiftCountResponse,
} from "@/apis/fnbShiftCount.apis";

export type FnbShiftCountTab = "entry" | "history";

export interface FnbShiftCountFormItem {
  itemId: string;
  itemName: string;
  category: "drink" | "snack";
  openingCount: number | "";
  closingCount: number | "";
  physicalSold?: number;
  systemSold: number;
  variance?: number;
}

export interface FnbShiftCountFormValues {
  note: string;
  items: FnbShiftCountFormItem[];
}

export type {
  IFnbShiftCountLine,
  IFnbShiftCountReportItem,
  IFnbShiftCountResponse,
};
