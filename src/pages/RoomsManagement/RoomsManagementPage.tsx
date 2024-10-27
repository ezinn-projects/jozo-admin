import Typography from "@/components/ui/typography";
import UpsertRoomModal from "./components/Modals/UpsertRoomModal";

function RoomsManagementPage() {
  return (
    <div className="mt-3">
      <Typography variant="h1">Rooms management</Typography>

      <UpsertRoomModal id="2347632784632487362" />
    </div>
  );
}

export default RoomsManagementPage;
