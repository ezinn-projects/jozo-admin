import AuthGuard from "@/components/guards/AuthGuard";
import RoleGuard from "@/components/guards/RoleGuard";
import { Layout } from "@/components/Layout";
import { Role } from "@/constants/enum";
import PATHS from "@/constants/paths";

import { lazy, Suspense } from "react";
import {
  Outlet,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";

const AdminPage = lazy(() => import("@/pages/AdminPage"));
const RoomsListPage = lazy(
  () => import("@/pages/RoomsManagement/pages/RoomsListPage")
);
const UpsertRoomPage = lazy(
  () => import("@/pages/RoomsManagement/pages/UpsertRoomPage")
);
const StaffPage = lazy(() => import("@/pages/StaffPage"));
const UnauthorizedPage = lazy(() => import("@/pages/UnauthorizedPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const PricePage = lazy(() => import("@/pages/PricePage"));

function useRoute() {
  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path={PATHS.LOGIN} element={<LoginPage />} />
          <Route path={PATHS.UNAUTHORIZED} element={<UnauthorizedPage />} />

          <Route element={<AuthGuard />}>
            <Route
              element={
                <Layout>
                  <Outlet />
                </Layout>
              }
            >
              <Route element={<RoleGuard requiredRoles={[Role.Admin]} />}>
                <Route path={PATHS.HOME} element={<AdminPage />} />
                <Route path={PATHS.ROOMS}>
                  <Route index element={<RoomsListPage />} />
                  <Route path={PATHS.NEW_ROOM} element={<UpsertRoomPage />} />
                  <Route path={PATHS.EDIT_ROOM} element={<UpsertRoomPage />} />
                </Route>

                <Route path={PATHS.PRICE} element={<PricePage />} />
              </Route>

              <Route element={<RoleGuard requiredRoles={[Role.Staff]} />}>
                <Route path="/staff" element={<StaffPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default useRoute;
