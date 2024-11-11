import {
  Sidebar,
  SidebarContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { MENU_ITEMS, MenuItem } from "@/constants/menuItems";
import { NavLink } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

export function AppSidebar() {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {}
  );

  const toggleExpand = (title: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const renderMenuItems = (items: MenuItem[]) => {
    return items.map((item) => {
      const isExpanded = expandedItems[item.title] || false;
      const hasChildren = !!item.children;

      return (
        <SidebarMenuItem key={item.title}>
          {hasChildren ? (
            <>
              <SidebarMenuButton
                onClick={() => toggleExpand(item.title)}
                className="flex justify-between items-center"
              >
                <div className="flex items-center">
                  <item.icon />
                  <span className="ml-2">{item.title}</span>
                </div>
                <span>
                  {isExpanded ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </span>
              </SidebarMenuButton>
              {isExpanded && (
                <SidebarMenu className="pl-4">
                  {renderMenuItems(item?.children || [])}
                </SidebarMenu>
              )}
            </>
          ) : (
            <SidebarMenuButton asChild>
              <NavLink to={item?.url || ""} className="flex items-center">
                <item.icon />
                <span className="ml-2">{item.title}</span>
              </NavLink>
            </SidebarMenuButton>
          )}
        </SidebarMenuItem>
      );
    });
  };

  return (
    <Sidebar>
      <SidebarContent>
        <Accordion type="single" collapsible>
          <AccordionItem value="generalManagement">
            <AccordionTrigger>
              <SidebarGroupLabel>General Management</SidebarGroupLabel>
            </AccordionTrigger>
            <AccordionContent>
              <SidebarMenu className="list-none">
                {renderMenuItems(
                  MENU_ITEMS.find((item) => item.title === "General Management")
                    ?.children || []
                )}
              </SidebarMenu>
            </AccordionContent>
          </AccordionItem>

          {MENU_ITEMS.filter((item) => item.title !== "General Management").map(
            (item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink to={item?.url || ""} className="flex items-center">
                    <item.icon />
                    <span className="ml-2">{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          )}
        </Accordion>
      </SidebarContent>
    </Sidebar>
  );
}
