"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Save, Key } from "lucide-react";

type ApiKeyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ApiKeyDialog({ open, onOpenChange }: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);

  // 加载现有的 API Key
  useEffect(() => {
    if (open) {
      loadApiKey();
    }
  }, [open]);

  const loadApiKey = async () => {
    try {
      const res = await fetch("/api/user/api-key", {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.hasApiKey) {
          setHasExistingKey(true);
          setApiKey(""); // 不显示实际的key，只显示占位符
        }
      }
    } catch (error) {
      console.error("加载 API Key 失败:", error);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      alert("请输入 API Key");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/api-key", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      if (res.ok) {
        alert("API Key 保存成功！");
        setHasExistingKey(true);
        onOpenChange(false);
      } else {
        const data = await res.json();
        alert(data.error || "保存失败");
      }
    } catch (error) {
      console.error("保存 API Key 失败:", error);
      alert("保存失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除 API Key 吗？删除后将使用默认配置。")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/api-key", {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        alert("API Key 已删除");
        setApiKey("");
        setHasExistingKey(false);
        onOpenChange(false);
      } else {
        alert("删除失败");
      }
    } catch (error) {
      console.error("删除 API Key 失败:", error);
      alert("删除失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Key 设置
          </DialogTitle>
          <DialogDescription>
            设置您的 DeepSeek API Key。如果不设置，将使用系统默认配置。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">API Key</label>
            <div className="relative">
              <Input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  hasExistingKey
                    ? "已设置 API Key，输入新的覆盖"
                    : "输入您的 DeepSeek API Key"
                }
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {hasExistingKey && (
              <p className="text-xs text-green-600">✓ 已设置 API Key</p>
            )}
          </div>

          <div className="bg-blue-50 p-3 rounded-md text-sm">
            <p className="font-medium mb-1">如何获取 API Key：</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li>
                访问{" "}
                <a
                  href="https://github.com/chatanywhere/GPT_API_free?tab=readme-ov-file#%E5%85%8D%E8%B4%B9%E4%BD%BF%E7%94%A8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  GPT_API_free 项目页面
                </a>
              </li>
              <li>注册/登录账号</li>
              <li>在控制台中创建 API Key</li>
            </ol>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {hasExistingKey && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              删除
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading || !apiKey.trim()}
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
