export interface FnbMenu {
  _id: string;
  name: string;
  price: string;
  description: string;
  image: string;
  category: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface FnbFormValues {
  name: string;
  price: string;
  description: string;
  category: string;
  image?: string;
}
