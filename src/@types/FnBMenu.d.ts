export interface Inventory {
  quantity: number;
  minStock: number;
  maxStock: number;
}

export interface Variant {
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
}
