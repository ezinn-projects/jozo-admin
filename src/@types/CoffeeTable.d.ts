export interface ICoffeeTable {
  _id?: string;
  code: string;
  name: string;
  isActive: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ICreateCoffeeTableRequestBody {
  code: string;
  name: string;
  isActive?: boolean;
  description?: string;
  createdBy?: string;
}

export interface IUpdateCoffeeTableRequestBody {
  code?: string;
  name?: string;
  isActive?: boolean;
  description?: string;
  updatedBy?: string;
}
