import useRoute from "@/hooks/useRoute";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/Authorization.context";
import { Toaster } from "@/components/ui/toaster";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient();

function App() {
  const route = useRoute();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{route}</AuthProvider>
      <Toaster />

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
