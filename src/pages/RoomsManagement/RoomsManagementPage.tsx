import Typography from "@/components/ui/typography";
import UpsertRoomModal from "./components/Modals/UpsertRoomModal";

function RoomsManagementPage() {
  return (
    <div className="mt-3">
      <Typography variant="h1">Rooms management</Typography>

      <UpsertRoomModal />
    </div>
  );
}

export default RoomsManagementPage;
