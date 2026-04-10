"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/sehat/auth", { method: "DELETE" });
    router.push("/sehat/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-white/60 hover:text-white text-sm transition-colors"
    >
      Logout
    </button>
  );
}
