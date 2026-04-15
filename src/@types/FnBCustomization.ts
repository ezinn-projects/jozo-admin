export interface FnBMenuCustomizationOption {
  optionKey: string;
  label: string;
  priceDelta?: number;
}

/** Nhóm tuỳ chọn (vd: độ ngọt, topping). */
export interface FnBMenuCustomizationGroup {
  groupKey: string;
  label: string;
  minSelect: number;
  maxSelect: number;
  options: FnBMenuCustomizationOption[];
}

export interface IFnBCustomizationGroupTemplate {
  _id?: string;
  templateKey: string;
  label: string;
  group: FnBMenuCustomizationGroup;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICreateCustomizationGroupTemplateRequestBody {
  templateKey: string;
  label: string;
  group: FnBMenuCustomizationGroup;
  isActive?: boolean;
}

export interface IUpdateCustomizationGroupTemplateRequestBody
  extends Partial<ICreateCustomizationGroupTemplateRequestBody> {}

export interface FnBMenuCustomizationTemplateRef {
  templateKey: string;
}

export interface FnBMenuCustomizationOverride {
  groupKey: string;
  optionKey: string;
  priceDelta: number;
}
