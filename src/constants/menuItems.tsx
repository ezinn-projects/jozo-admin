import {
  BedDouble,
  Calendar,
  Clock,
  DoorOpenIcon,
  Home,
  PercentIcon,
  Settings2,
  UtensilsCrossed,
  Users,
  UserPlus,
  Briefcase,
} from "lucide-react";
import { Role } from "./enum";
import PATHS from "./paths";

export type MenuItem = {
  title: string;
  url?: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  subItems?: MenuItem[];
  roles?: Role[]; // Thêm thuộc tính roles để kiểm soát quyền truy cập
};

const MENU_ITEMS: MenuItem[] = [
  {
    title: "Home",
    url: PATHS.HOME,
    icon: Home,
    subItems: [], // No sub-items for Home
    roles: [Role.Admin, Role.Staff], // Cả admin và staff đều có thể truy cập
  },
  {
    title: "My Work",
    url: PATHS.MY_WORK,
    icon: Briefcase,
    subItems: [], // No sub-items for My Work
    roles: [Role.Admin, Role.Staff], // Cả admin và staff đều có thể truy cập
  },
  {
    title: "Rooms management",
    url: PATHS.ROOMS,
    icon: DoorOpenIcon,
    subItems: [], // No sub-items for Rooms management
    roles: [Role.Admin, Role.Staff], // Cả admin và staff đều có thể truy cập
  },
  {
    title: "Gerenral management",
    icon: Settings2,
    roles: [Role.Admin], // Chỉ admin mới có thể truy cập
    subItems: [
      {
        title: "Users Management",
        url: PATHS.USERS_MANAGEMENT,
        icon: Users,
        roles: [Role.Admin],
      },
      {
        title: "Staff Management",
        url: PATHS.STAFF_MANAGEMENT,
        icon: Users,
        roles: [Role.Admin],
      },
      {
        title: "Staff Schedule",
        url: PATHS.STAFF_SCHEDULE,
        icon: Clock,
        roles: [Role.Admin],
      },
      {
        title: "Room Types",
        url: PATHS.ROOM_TYPES_LISTS,
        icon: BedDouble,
        roles: [Role.Admin],
      },
      {
        title: "Pricing",
        url: PATHS.PRICE,
        icon: BedDouble,
        roles: [Role.Admin],
      },
      // menu fnb
      // {
      //   title: "Food & Beverage",
      //   url: PATHS.FNB,
      //   icon: AppleIcon,
      // },
      {
        title: "Menu Items",
        url: PATHS.MENU_ITEMS,
        icon: UtensilsCrossed,
        roles: [Role.Admin],
      },
      {
        title: "Promotion",
        url: PATHS.PROMOTION,
        icon: PercentIcon,
        roles: [Role.Admin],
      },
      {
        title: "Recruitment",
        url: PATHS.RECRUITMENT,
        icon: UserPlus,
        roles: [Role.Admin],
      },
    ],
  },
  {
    title: "Calendar",
    url: PATHS.CALENDAR,
    icon: Calendar,
    subItems: [], // No sub-items for Calendar
    roles: [Role.Admin, Role.Staff], // Cả admin và staff đều có thể truy cập
  },
  // {
  //   title: "Settings",
  //   url: PATHS.SETTINGS,
  //   icon: Settings,
  //   subItems: [], // No sub-items for Settings
  //   roles: [Role.Admin, Role.Staff], // Cả admin và staff đều có thể truy cập
  // },
  // total revenue
  {
    title: "Total Revenue",
    url: PATHS.TOTAL_REVENUE,
    icon: PercentIcon,
    subItems: [], // No sub-items for Total Revenue
    roles: [Role.Admin, Role.Staff], // Cả admin và staff đều có thể truy cập
  },
];

export { MENU_ITEMS };
