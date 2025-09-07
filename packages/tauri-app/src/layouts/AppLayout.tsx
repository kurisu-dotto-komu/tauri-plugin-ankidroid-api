import { ReactNode } from "react";
import DropdownNavigation from "../components/DropdownNavigation";
import AnkiConnectionIndicator from "../components/AnkiConnectionIndicator";
import ErrorDisplay from "../components/ErrorDisplay";
import { useAnkiContext } from "../contexts/AnkiContext";
import type { Tab, TabType } from "../types/navigation";

interface AppLayoutProps {
  children: ReactNode;
  tabs: Tab[];
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function AppLayout({
  children,
  tabs,
  activeTab,
  onTabChange,
}: AppLayoutProps) {
  const { status, isConnected, error, requestPermission } = useAnkiContext();
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Mobile Header - Sticky */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">
        <div className="px-4 pt-6 pb-2 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">AnkiDroid API</h1>
          {/* Connection Indicator - shows checkmark when connected */}
          {isConnected && (
            <AnkiConnectionIndicator 
              status={status}
              onRequestPermission={requestPermission}
            />
          )}
        </div>

        {/* Dropdown Navigation - only show when connected */}
        {isConnected && (
          <DropdownNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(tab) => onTabChange(tab as TabType)}
          />
        )}
      </header>

      <div className="px-4 pb-4 max-w-md mx-auto">
        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-3">
          <div className="p-4">
            {children}
          </div>
        </div>

        {/* Error Display */}
        <ErrorDisplay error={error} />
      </div>
    </main>
  );
}