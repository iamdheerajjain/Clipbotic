"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function StatCard({ title, value, icon: Icon, tone = "default" }) {
  const toneClasses = {
    default: "",
    success: "text-emerald-400",
    warning: "text-amber-400",
    danger: "text-rose-400",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon ? (
          <Icon
            className={
              "h-4 w-4 " + (toneClasses[tone] || "text-muted-foreground")
            }
          />
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {/* Optional subtext can be added by parent if needed */}
      </CardContent>
    </Card>
  );
}

export default StatCard;
