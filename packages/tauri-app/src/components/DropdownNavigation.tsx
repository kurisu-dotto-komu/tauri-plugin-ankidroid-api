import { useState } from "react";
import { LuChevronDown, LuCheck } from "react-icons/lu";

export interface Tab {
  key: string;
  label: string;
  icon: string;
}

interface DropdownNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function DropdownNavigation({ tabs, activeTab, onTabChange }: DropdownNavigationProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const currentTab = tabs.find((tab) => tab.key === activeTab);

  return (
    <div className="relative bg-white">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="w-full flex items-center justify-between px-4 py-2 active:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-800 min-w-0 flex-1">
          <span className="text-lg flex-shrink-0">{currentTab?.icon}</span>
          <span className="truncate" title={currentTab?.label}>{currentTab?.label}</span>
        </span>
        <LuChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            dropdownOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {dropdownOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-xl z-50 max-h-[60vh] overflow-y-auto">
          {tabs.map((tab, index) => (
            <button
              key={tab.key}
              onClick={() => {
                onTabChange(tab.key);
                setDropdownOpen(false);
              }}
              className={`w-full px-4 py-3 text-left flex items-center gap-3 active:bg-gray-50 transition-colors ${
                activeTab === tab.key
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700"
              } ${
                index < tabs.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <span className="text-lg flex-shrink-0">{tab.icon}</span>
              <span className="text-sm font-medium truncate flex-1 min-w-0" title={tab.label}>{tab.label}</span>
              {activeTab === tab.key && (
                <LuCheck className="w-4 h-4 ml-auto text-blue-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}