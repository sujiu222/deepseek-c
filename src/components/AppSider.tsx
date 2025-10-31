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
import { useEffect, useState } from "react";
import useStore from "@/store/store";
import { Prisma } from "@prisma/client";

// Menu items.
const items = [
  {
    title: "新对话",
    url: "/",
    icon: MessageCirclePlus,
  },
];

type messageHistory = Prisma.ConversationGetPayload<{
  include: { messages: { take: 1 } };
}>;

export function AppSidebar() {
  const [openLogin, setOpenLogin] = useState(false);
  const [messageHistory, setMessageHistory] = useState<messageHistory[]>([]);
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);

  const handleSignup = () => {
    if (user) {
      setUser(null);
      return;
    }
    setOpenLogin(true);
  };

  const getUserMessageHistory = async () => {
    const res = await fetch("/api/user/conversation-history", {
      method: "GET",
    });
    const data = await res.json();
    return data;
  };

  useEffect(() => {
    const initUser = async () => {
      try {
        const res = await fetch("/api/user", {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          }
          console.log(data);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    initUser();
  }, []);

  useEffect(() => {
    (async () => {
      const messageArr = await getUserMessageHistory();
      setMessageHistory(messageArr.conversation);
      console.log(messageHistory);
    })();
  }, [user]);

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
              {messageHistory.map((msgRaw) => (
                <SidebarMenuItem key={msgRaw.id}>
                  <SidebarMenuButton asChild>
                    <a href="#">
                      <span>{msgRaw.messages[0].content}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
