import Header from "@/components/Layout/Header";
import { Button } from "@/components/ui/button";
import PATHS from "@/constants/paths";
import { Link } from "react-router-dom";

function RoomsListPage() {
  return (
    <div>
      <Header title="Rooms management" subtitle="List of rooms" />

      <Link to={PATHS.NEW_ROOM}>
        <Button className="mt-3">New room</Button>
      </Link>
    </div>
  );
}

export default RoomsListPage;
