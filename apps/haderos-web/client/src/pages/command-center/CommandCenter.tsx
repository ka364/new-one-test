import { useState, useEffect } from "react";
import CommandCenterLayout from "@/components/command-center/CommandCenterLayout";
import { HRSystemCard } from "@/components/command-center/cards/HRSystemCard";
import { SmartShippingCard } from "@/components/command-center/cards/SmartShippingCard";
import { LiveShowroomCard } from "@/components/command-center/cards/LiveShowroomCard";
import { BoardDecisionsCard } from "@/components/command-center/cards/BoardDecisionsCard";
import { AIInsightsCard } from "@/components/command-center/cards/AIInsightsCard";
import { SystemStatusCard } from "@/components/command-center/cards/SystemStatusCard";

export default function CommandCenter() {
  console.log("🚀 CommandCenter component loaded!");
  return (
    <CommandCenterLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Row 1: HR System, Smart Shipping, Live Showroom */}
        <HRSystemCard />
        <SmartShippingCard />
        <LiveShowroomCard />

        {/* Row 2: Board Decisions (larger), AI Insights */}
        <div className="lg:col-span-2">
          <BoardDecisionsCard />
        </div>
        <AIInsightsCard />

        {/* Row 3: System Status (full width) */}
        <div className="lg:col-span-3">
          <SystemStatusCard />
        </div>
      </div>
    </CommandCenterLayout>
  );
}
