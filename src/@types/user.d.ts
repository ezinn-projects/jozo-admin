import { Role } from "@/constants/enum";

export type User = {
  id: string;
  email: string;
  role: Role;
  name: string;
  dateOfBirth: string;
  createdAt: string;
  updatedAt: string;
  bio: string;
  location: string;
  website: string;
  username: string;
  coverPhoto: string;
  avatar: string;
};
