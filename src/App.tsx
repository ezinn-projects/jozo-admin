import useRoute from "@/hooks/useRoute";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { lazy, Suspense } from "react";
import { AuthProvider } from "./context/Authorization.context";
import { RoomEventsProvider } from "./context/RoomEventsContext";

const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-query-devtools").then((module) => ({
        default: module.ReactQueryDevtools,
      }))
    )
  : null;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function App() {
  const route = useRoute();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RoomEventsProvider>{route}</RoomEventsProvider>
      </AuthProvider>
      <Toaster />
      {ReactQueryDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}

export default App;
