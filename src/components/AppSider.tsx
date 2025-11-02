"use client";
import { ChevronUp, MessageCirclePlus } from "lucide-react";
import Login from "@/components/Login";
import { ApiKeyDialog } from "@/components/ApiKeyDialog";
import Link from "next/link";

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
  const [openApiKey, setOpenApiKey] = useState(false);
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
    if (!user) return { conversation: [] };
    try {
      const res = await fetch("/api/user/conversation-history", {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("获取历史记录失败:", error);
      return { conversation: [] };
    }
  };

  const refreshHistory = async () => {
    const messageArr = await getUserMessageHistory();
    setMessageHistory(messageArr.conversation || []);
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
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    initUser();
  }, [setUser]);

  // 用户登录后立即刷新历史
  useEffect(() => {
    if (user) {
      refreshHistory();
    } else {
      setMessageHistory([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 定期刷新历史记录（每 10 秒）
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      refreshHistory();
    }, 10000); // 10 秒刷新一次

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 监听自定义事件，发送消息后主动刷新
  useEffect(() => {
    const handleRefresh = () => {
      refreshHistory();
    };

    window.addEventListener("conversationUpdated", handleRefresh);
    return () =>
      window.removeEventListener("conversationUpdated", handleRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <Sidebar>
      <Login
        open={openLogin}
        onSuccess={() => setOpenLogin(false)}
        onCancel={() => setOpenLogin(false)}
      />
      <ApiKeyDialog open={openApiKey} onOpenChange={setOpenApiKey} />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton variant="ring-2" asChild>
                    <Link href="/chat/new">
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>历史记录</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {messageHistory.map((msgRaw) => (
                <SidebarMenuItem key={msgRaw.id}>
                  <SidebarMenuButton asChild>
                    <Link href={`/chat/${msgRaw.id}`}>
                      <span>{msgRaw.messages?.[0]?.content || "新会话"}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
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
            <DropdownMenuItem onClick={() => setOpenApiKey(true)}>
              API Key
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
