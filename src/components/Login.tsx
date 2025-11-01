"use client";

import { loginOrSignUp } from "@/lib/auth";
import useStore from "@/store/store";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

type Props = {
  onSuccess?: () => void;
  onCancel?: () => void;
  open: boolean;
};
function Login({ onSuccess, onCancel, open }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const setUser = useStore((state) => state.setUser);
  const { toast } = useToast();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast({
        variant: "destructive",
        title: "错误",
        description: "请输入用户名和密码",
      });
      return;
    }

    const user = await loginOrSignUp(username, password, !isLogin);
    if (user && "error" in user) {
      toast({
        variant: "destructive",
        title: isLogin ? "登录失败" : "注册失败",
        description: user.error,
      });
      return;
    }

    setUser(user);
    toast({
      title: "成功",
      description: isLogin ? "登录成功！" : "注册成功！",
    });
    onSuccess?.();
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" />
          <form
            onSubmit={handleSubmit}
            className="relative w-full max-w-sm rounded-lg bg-white p-5 shadow-lg"
          >
            <div className="mb-4 w-full flex justify-center items-center gap-2">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`px-3 py-1.5 rounded-md text-sm ${
                  isLogin
                    ? "bg-blue-600 text-white shadow"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                登陆
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`px-3 py-1.5 rounded-md text-sm ${
                  !isLogin
                    ? "bg-blue-600 text-white shadow"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                注册
              </button>
            </div>
            <div>
              <label htmlFor="username">用户名</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                type="text"
                id="username"
                className="mt-1 w-full rounded border px-3 py-2 text-sm outline-none focus:ring"
              />
            </div>
            <div>
              <label htmlFor="password">密码</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                id="password"
                className="mt-1 w-full rounded border px-3 py-2 text-sm outline-none focus:ring"
              />
            </div>
            <button
              type="submit"
              className="mt-4 w-full rounded bg-blue-600 px-3 py-2 text-white text-sm hover:opacity-90"
            >
              {isLogin ? "登陆" : "注册"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default Login;
