"use client";
import { ChevronUp, MessageCirclePlus } from "lucide-react";
import Login from "@/components/Login";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useState } from "react";
import useStore, { StoreState } from "@/store/store";

// Menu items.
const items = [
  {
    title: "新对话",
    url: "#",
    icon: MessageCirclePlus,
  },
];

export function AppSidebar() {
  const [openLogin, setOpenLogin] = useState(false);
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);

  fetch("/api/user/conversation", {
    method: "POST",
  });

  const handleSignup = () => {
    if (user) {
      setUser(null);
      return;
    }
    setOpenLogin(true);
  };

  return (
    <Sidebar>
      <Login
        open={openLogin}
        onSuccess={() => setOpenLogin(false)}
        onCancel={() => setOpenLogin(false)}
      />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton variant="ring-2" asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>历史记录</SidebarGroupLabel>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/history/123">
                    <span>会话 123</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton>
              {user ? `用户 : ${user.username}` : "未登录"}
              <ChevronUp className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            className="w-[var(--radix-dropdown-menu-trigger-width)]"
          >
            <DropdownMenuItem onClick={handleSignup}>
              登陆/登出
            </DropdownMenuItem>
            <DropdownMenuItem>账单</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
