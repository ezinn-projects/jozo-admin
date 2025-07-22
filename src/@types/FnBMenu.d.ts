export interface Inventory {
  quantity: number;
  unit?: string;
  minStock: number;
  maxStock: number;
  lastUpdated?: Date;
}

export interface Variant {
  id?: string; // Thêm trường id để đồng bộ với dữ liệu thực tế
  name: string;
  price?: string;
  isAvailable: boolean;
  image?: string;
  inventory?: Inventory;
}

export interface FnbMenu {
  _id: string;
  name: string;
  price: string;
  description: string;
  image: string;
  category: string;
  hasVariants: boolean;
  variants?: Variant[];
  inventory?: Inventory;
  createdAt: Date;
  updatedAt?: Date;
}

export interface FnbFormValues {
  name: string;
  price: string;
  description: string;
  category: string;
  image?: string;
  hasVariants: boolean;
  variants?: Variant[];
  inventory?: Inventory;
}
