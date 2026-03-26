"use client";

import { useState } from "react";
import { EngeeChat } from "@/components/engee/agent-chat";
import { SurveyForm } from "@/components/engee/survey-form";
import { PageHeader } from "@/components/shared/page-header";
import { ClipboardList, MessageCircle } from "lucide-react";

type Tab = "survey" | "chat";

export default function EngeePage() {
  const [activeTab, setActiveTab]         = useState<Tab>("survey");
  const [chatSeed, setChatSeed]           = useState<string | null>(null);

  function handleSurveyComplete(employeeName: string) {
    setChatSeed(
      `I've just completed my interest survey. My name is ${employeeName}. Can you find me a mentor match?`
    );
    setActiveTab("chat");
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Engee"
        description="New employee engagement agent — supports new hires through their first 90 days with interest surveys, mentor matching, and milestone check-ins."
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        <TabButton
          active={activeTab === "survey"}
          onClick={() => setActiveTab("survey")}
          icon={<ClipboardList className="h-4 w-4" />}
          label="Interest Survey"
        />
        <TabButton
          active={activeTab === "chat"}
          onClick={() => setActiveTab("chat")}
          icon={<MessageCircle className="h-4 w-4" />}
          label="Chat with Engee"
        />
      </div>

      {/* Content */}
      {activeTab === "survey" ? (
        <div className="bg-white rounded-2xl border border-border shadow-sm px-6 py-6">
          <SurveyForm onComplete={handleSurveyComplete} />
        </div>
      ) : (
        <EngeeChat seedMessage={chatSeed} onSeedConsumed={() => setChatSeed(null)} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active
          ? "bg-white text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
