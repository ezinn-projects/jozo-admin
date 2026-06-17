import http from "@/utils/http";

export type FnbShiftCountCategory = "drink" | "snack";

export interface IFnbShiftCountLine {
  itemId: string;
  itemName: string;
  category: FnbShiftCountCategory;
  openingCount?: number;
  midShiftAddition?: number;
  closingCount?: number;
}

export interface IFnbShiftCountReportItem extends IFnbShiftCountLine {
  physicalSold?: number;
  systemSold: number;
  variance?: number;
}

export interface IFnbShiftCountSummary {
  shortageCount: number;
  shortageItems: Array<{
    itemId: string;
    itemName: string;
    variance: number;
  }>;
}

export interface IFnbShiftCountResponse {
  _id?: string;
  staffId: string;
  staffName?: string;
  businessDate: string;
  items: IFnbShiftCountReportItem[];
  note?: string;
  summary: IFnbShiftCountSummary;
  editable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IFnbShiftCountSaveItem {
  itemId: string;
  openingCount?: number;
  midShiftAddition?: number;
  closingCount?: number;
}

export interface IFnbShiftCountSaveBody {
  items: IFnbShiftCountSaveItem[];
  note?: string;
}

export interface IFnbShiftCountGetParams {
  date: string;
  staffId?: string;
}

export interface IFnbShiftCountHistoryParams {
  from?: string;
  to?: string;
  staffId?: string;
}

const CONTROLLER = "/fnb-shift-counts";

const fnbShiftCountApis = {
  getItemsTemplate: () =>
    http.get<HTTPResponse<IFnbShiftCountLine[]>>(`${CONTROLLER}/items-template`),

  getShiftCount: (params: IFnbShiftCountGetParams) =>
    http.get<HTTPResponse<IFnbShiftCountResponse>>(CONTROLLER, { params }),

  saveShiftCount: (params: { date: string; staffId?: string }, body: IFnbShiftCountSaveBody) =>
    http.put<HTTPResponse<IFnbShiftCountResponse>>(CONTROLLER, body, { params }),

  getHistory: (params?: IFnbShiftCountHistoryParams) =>
    http.get<HTTPResponse<IFnbShiftCountResponse[]>>(`${CONTROLLER}/history`, {
      params,
    }),
};

export default fnbShiftCountApis;
