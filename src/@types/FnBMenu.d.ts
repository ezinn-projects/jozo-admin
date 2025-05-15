export interface Inventory {
  quantity: number;
  unit: string;
  minStock: number;
  maxStock: number;
}

export interface FnbMenu {
  _id: string;
  name: string;
  price: string;
  description: string;
  image: string;
  category: string;
  inventory: Inventory;
  createdAt: Date;
  updatedAt?: Date;
}

export interface FnbFormValues {
  name: string;
  price: string;
  description: string;
  category: string;
  image?: string;
  inventory: Inventory;
}
