import useRoute from "@/hooks/useRoute";
import { AuthProvider } from "./context/Authorization.context";

function App() {
  const route = useRoute();

  return <AuthProvider>{route}</AuthProvider>;
}

export default App;
