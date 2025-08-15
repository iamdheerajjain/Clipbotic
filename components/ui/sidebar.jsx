"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

const Sidebar = React.forwardRef(({ className, children, ...props }, ref) => (
  <aside
    ref={ref}
    className={cn(
      "flex h-full w-72 flex-col border-r border-border bg-sidebar backdrop-blur-xl shadow-[inset_-1px_0_0_var(--sidebar-border),0_25px_50px_rgba(0,0,0,0.5)]",
      className
    )}
    {...props}
  >
    {children}
  </aside>
));
Sidebar.displayName = "Sidebar";

const SidebarHeader = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex h-20 items-center border-b border-border px-6 bg-gradient-to-r from-white/[0.02] to-transparent",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
SidebarHeader.displayName = "SidebarHeader";

const SidebarContent = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("flex-1 overflow-auto", className)} {...props}>
      {children}
    </div>
  )
);
SidebarContent.displayName = "SidebarContent";

const SidebarFooter = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex h-20 items-center border-t border-border px-6 bg-gradient-to-r from-transparent to-white/[0.02]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
SidebarFooter.displayName = "SidebarFooter";

const SidebarGroup = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col gap-3 p-6", className)}
      {...props}
    >
      {children}
    </div>
  )
);
SidebarGroup.displayName = "SidebarGroup";

const SidebarItem = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transform-gpu will-change-transform transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "border border-transparent hover:border-[color-mix(in_oklab,var(--primary)_25%,transparent)] hover:bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.18)]",
        "group relative overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10 flex items-center gap-3">{children}</div>
    </div>
  )
);
SidebarItem.displayName = "SidebarItem";

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarItem,
};
