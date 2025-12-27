"use client";

import { useState } from "react";
import { AdminTable } from "@/components/admin-table";
import { CompetitionSettings } from "@/components/competition-settings";
import { BeerRegistration } from "@/components/beer-registration";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Beer,
  Trophy,
  ClipboardList,
  Settings,
  Menu,
  X,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { Round } from "@/db/schema";

interface AdminSidebarProps {
  votingEnabled: boolean;
  activeRound: Round | null;
  children?: React.ReactNode;
}

type TabId = "scores" | "registration" | "settings";

const navItems: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "scores",
    label: "Ergebnisse",
    icon: <Trophy className="h-5 w-5" />,
  },
  {
    id: "registration",
    label: "Bier-Check-In",
    icon: <ClipboardList className="h-5 w-5" />,
  },
  {
    id: "settings",
    label: "Einstellungen",
    icon: <Settings className="h-5 w-5" />,
  },
];

export function AdminSidebar({
  votingEnabled,
  activeRound,
}: AdminSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabId>("scores");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case "scores":
        return <AdminTable />;
      case "registration":
        return <BeerRegistration />;
      case "settings":
        return <CompetitionSettings />;
      default:
        return <AdminTable />;
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-40 lg:hidden bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Beer className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            {votingEnabled ? (
              <Badge className="bg-success/10 text-success border-success/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Live
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-muted text-muted-foreground"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Pausiert
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="hidden lg:flex items-center gap-3 px-6 py-5 border-b border-border">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Beer className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Bier Voting</h1>
            <p className="text-xs text-muted-foreground">Admin Dashboard</p>
          </div>
        </div>

        {/* Status Card */}
        <div className="p-4 border-b border-border">
          <div
            className={`p-3 rounded-lg ${
              votingEnabled
                ? "bg-success/10 border border-success/30"
                : "bg-muted border border-border"
            }`}
          >
            <div className="flex items-center gap-2">
              {votingEnabled ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p
                  className={`font-medium text-sm ${
                    votingEnabled ? "text-success" : "text-muted-foreground"
                  }`}
                >
                  {votingEnabled ? "Abstimmung aktiv" : "Abstimmung pausiert"}
                </p>
                {activeRound && (
                  <p className="text-xs text-muted-foreground">
                    Runde: {activeRound.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 mt-2 lg:mt-0">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-0 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8 max-w-6xl">
          {/* Page Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              {navItems.find((item) => item.id === activeTab)?.label}
            </h2>
          </div>

          {/* Content */}
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
