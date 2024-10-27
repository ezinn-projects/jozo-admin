import { Calendar, Settings, Home, BedDouble } from "lucide-react";
import PATHS from "./paths";

export type MenuItem = {
  title: string;
  url?: string;
  icon: React.FC;
  children?: MenuItem[];
};

const MENU_ITEMS: MenuItem[] = [
  {
    title: "Home",
    url: PATHS.HOME,
    icon: Home,
  },
  {
    title: "Rooms management",
    url: PATHS.ROOMS,
    icon: BedDouble,
  },
  {
    title: "Quản lý chung",
    icon: BedDouble,
    children: [
      {
        title: "Amenities",
        url: PATHS.AMENITIES,
        icon: BedDouble,
      },
      {
        title: "Room Types",
        url: PATHS.ROOM_TYPES,
        icon: BedDouble,
      },
      {
        title: "Pricing",
        url: PATHS.PRICING,
        icon: BedDouble,
      },
    ],
  },
  {
    title: "Calendar",
    url: PATHS.CALENDAR,
    icon: Calendar,
  },
  {
    title: "Settings",
    url: PATHS.SETTINGS,
    icon: Settings,
  },
];

export { MENU_ITEMS };
