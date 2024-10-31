import { Button } from "@/components/ui/button";
import Typography from "@/components/ui/typography";
import PATHS from "@/constants/paths";
import { Link } from "react-router-dom";

function RoomsManagementPage() {
  return (
    <div className="mt-3">
      <Typography variant="h1">Rooms management</Typography>

      <Link to={PATHS.NEW_ROOM}>
        <Button>New room</Button>
      </Link>
    </div>
  );
}

export default RoomsManagementPage;
