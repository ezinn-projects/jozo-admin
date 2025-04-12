export interface FnbMenu {
  _id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface FnbFormValues {
  name: string;
  price: number;
  description: string;
  category: string;
  image?: string;
}
