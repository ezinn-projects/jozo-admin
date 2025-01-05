import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { MENU_ITEMS } from "@/constants/menuItems";
import useAuth from "@/hooks/useAuth";
import { ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import Typography from "../ui/typography";
import { Link } from "react-router-dom";

export function AppSidebar() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { user } = useAuth();

  // Toggle function to expand or collapse a menu item
  const toggleExpand = (title: string) => {
    setExpanded((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <Sidebar className="overflow-x-hidden">
      {/* Sidebar Header */}
      <SidebarHeader>
        <h2 className="text-lg font-semibold">Jozo - Admin</h2>
      </SidebarHeader>

      {/* Sidebar Content */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MENU_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleExpand(item.title)}
                    >
                      <Link to={item.url || "#"} className="flex items-center">
                        <item.icon className="w-5 h-5" />
                        <span className="ml-2">{item.title}</span>
                      </Link>
                      {item.subItems && item.subItems.length > 0 && (
                        <ChevronDown
                          className={`ml-2 transition-transform ${
                            expanded[item.title] ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </div>
                  </SidebarMenuButton>

                  {/* Sub-menu for expandable items */}
                  {item.subItems &&
                    item.subItems.length > 0 &&
                    expanded[item.title] && (
                      <SidebarMenu className="mt-2">
                        {item.subItems.map((subItem) => (
                          <SidebarMenuItem key={subItem.title}>
                            <SidebarMenuButton asChild>
                              <Link to={subItem.url || "#"}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Sidebar Footer */}
      <SidebarFooter>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-2">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>QN</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <Typography variant="h6" className="text-sm">
                {user?.name}
              </Typography>
              <Typography variant="span" className="text-xs">
                {user?.email}
              </Typography>
            </div>
          </div>

          <Button variant="ghost" size="icon" title="Logout">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
