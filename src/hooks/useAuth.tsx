import { AuthContext } from "@/context/Authorization.context";
import { useContext } from "react";

export const useAuth = () => useContext(AuthContext);
