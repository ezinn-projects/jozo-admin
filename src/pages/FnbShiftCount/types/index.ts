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
  /** Món cha chỉ để nhóm variant — không nhập đầu ca / kết ca */
  isParent?: boolean;
  /** Biến thể của món cha — hiển thị thụt vào dưới parent */
  isVariant?: boolean;
  openingCount: number | "";
  midShiftAddition: number | "";
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
