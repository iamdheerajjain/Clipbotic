"use client";
import { useAuthContext } from "@/app/providers";
import React from "react";
import Image from "next/image";

function AppHeader() {
  const { user } = useAuthContext();
  return (
    <div className="h-20 flex justify-end items-center border-b border-border bg-background/60 backdrop-blur-xl sticky top-0 z-30 px-6">
      <Image
        src={user?.photoURL || "/default-avatar.png"}
        alt="user"
        width={40}
        height={40}
        className="rounded-full border border-border"
      />
    </div>
  );
}

export default AppHeader;
