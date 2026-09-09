"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="text-sm text-slate-500 hover:text-slate-900"
    >
      Sair
    </button>
  );
}
