import {
  Calendar,
  Settings,
  Home,
  BedDouble,
  DoorOpenIcon,
  Settings2,
  AppleIcon,
} from "lucide-react";
import PATHS from "./paths";

export type MenuItem = {
  title: string;
  url?: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  subItems?: MenuItem[];
};

const MENU_ITEMS: MenuItem[] = [
  {
    title: "Home",
    url: PATHS.HOME,
    icon: Home,
    subItems: [], // No sub-items for Home
  },
  {
    title: "Rooms management",
    url: PATHS.ROOMS,
    icon: DoorOpenIcon,
    subItems: [], // No sub-items for Rooms management
  },
  {
    title: "Gerenral management",
    icon: Settings2,
    subItems: [
      {
        title: "Room Types",
        url: PATHS.ROOM_TYPES_LISTS,
        icon: BedDouble,
      },
      {
        title: "Pricing",
        url: PATHS.PRICE,
        icon: BedDouble,
      },
      // menu fnb
      {
        title: "Food & Beverage",
        url: PATHS.FNB,
        icon: AppleIcon,
      },
    ],
  },
  {
    title: "Calendar",
    url: PATHS.CALENDAR,
    icon: Calendar,
    subItems: [], // No sub-items for Calendar
  },
  {
    title: "Settings",
    url: PATHS.SETTINGS,
    icon: Settings,
    subItems: [], // No sub-items for Settings
  },
];

export { MENU_ITEMS };
