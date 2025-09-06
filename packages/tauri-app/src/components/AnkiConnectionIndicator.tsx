import { useState } from "react";
import type { AnkiDroidStatus } from "ankidroid-api-client";
import { LuCircleCheck, LuX, LuCheck } from "react-icons/lu";

interface AnkiConnectionIndicatorProps {
  status: AnkiDroidStatus | null;
  onRequestPermission?: () => void;
}

export default function AnkiConnectionIndicator({ 
  status, 
  onRequestPermission 
}: AnkiConnectionIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!status || !status.available) return null;

  return (
    <>
      {/* Indicator Button */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
        aria-label="AnkiDroid connection status"
      >
        <LuCircleCheck className="w-6 h-6 text-green-500" />
      </button>

      {/* Details Modal/Overlay */}
      {showDetails && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => setShowDetails(false)}
          />
          
          {/* Details Panel */}
          <div className="fixed top-16 right-4 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 z-50 min-w-[280px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">AnkiDroid Connection</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <LuX className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Status</span>
                <span className="text-sm font-medium text-green-600">Connected</span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Version</span>
                <span className="text-sm font-medium text-gray-900">
                  {status.version || "Unknown"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Installed</span>
                <StatusIcon value={status.installed} />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Permission</span>
                <StatusIcon value={status.hasPermission} />
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Provider</span>
                <StatusIcon value={status.providerReachable} />
              </div>
            </div>

            {!status.hasPermission && onRequestPermission && (
              <button
                onClick={() => {
                  onRequestPermission();
                  setShowDetails(false);
                }}
                className="mt-3 w-full px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium"
              >
                Grant Permission
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}

function StatusIcon({ value }: { value: boolean }) {
  return value ? (
    <LuCheck className="w-5 h-5 text-green-500" />
  ) : (
    <LuX className="w-5 h-5 text-red-500" />
  );
}