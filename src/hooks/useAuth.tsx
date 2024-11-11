import { AuthContext } from "@/context/Authorization.context";
import { useContext } from "react";

const useAuth = () => useContext(AuthContext);

export default useAuth;
