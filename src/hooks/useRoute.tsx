import { Layout } from "@/components/Layout";
import ProtectedLayout from "@/components/Layout/ProjectedLayout";
import { lazy, Suspense } from "react";
import {
  Outlet,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";

import { Role } from "@/constants/enum";
import PATHS from "@/constants/paths";

const AdminPage = lazy(() => import("@/pages/AdminPage"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const RoomsListPage = lazy(
  () => import("@/pages/RoomsManagement/pages/RoomsListPage")
);
const UpsertRoomPage = lazy(
  () => import("@/pages/RoomsManagement/pages/UpsertRoomPage")
);
const StaffPage = lazy(() => import("@/pages/StaffPage"));
const UnauthorizedPage = lazy(() => import("@/pages/UnauthorizedPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));

function useRoute() {
  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route
            element={
              <Layout>
                <Outlet />
              </Layout>
            }
          >
            <Route path="/" element={<HomePage />} />

            <Route element={<ProtectedLayout requiredRoles={[Role.Admin]} />}>
              <Route path={PATHS.HOME} element={<AdminPage />} />
              <Route path={PATHS.ROOMS}>
                <Route index element={<RoomsListPage />} />
                <Route path={PATHS.NEW_ROOM} element={<UpsertRoomPage />} />
                <Route path={PATHS.EDIT_ROOM} element={<UpsertRoomPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedLayout requiredRoles={[Role.Staff]} />}>
              <Route path="/staff" element={<StaffPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default useRoute;
