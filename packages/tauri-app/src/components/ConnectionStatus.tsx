import type { AnkiDroidStatus } from "ankidroid-api-client";
import { LuCheck, LuX } from "react-icons/lu";

interface ConnectionStatusProps {
  status: AnkiDroidStatus | null;
  onRequestPermission?: () => void;
}

export default function ConnectionStatus({ status, onRequestPermission }: ConnectionStatusProps) {
  if (!status) return null;

  return (
    <div
      className={`mb-3 p-3 rounded-xl ${
        status.available
          ? "bg-gradient-to-br from-green-50 to-emerald-50/50 border border-green-200"
          : "bg-gradient-to-br from-red-50 to-orange-50/50 border border-red-200"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${
            status.available
              ? "bg-gradient-to-br from-green-500 to-green-600"
              : "bg-gradient-to-br from-red-500 to-red-600"
          }`}
        >
          {status.available ? (
            <LuCheck className="w-6 h-6 text-white" />
          ) : (
            <LuX className="w-6 h-6 text-white" />
          )}
        </div>
        <div className="flex-1">
          <div
            className={`font-bold text-base ${
              status.available ? "text-green-800" : "text-red-800"
            }`}
          >
            {status.available ? "Connected" : "Not Connected"}
          </div>
          <div className="text-xs text-gray-600 font-medium">
            AnkiDroid v{status.version || "Unknown"}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Installed", value: status.installed },
          { label: "Permission", value: status.hasPermission },
          { label: "Provider", value: status.providerReachable },
        ].map((item, index) => (
          <div key={index} className="bg-white/60 rounded-lg p-2">
            <div
              className={`text-xs font-semibold mb-1 text-center ${
                item.value ? "text-green-600" : "text-gray-500"
              }`}
            >
              {item.label}
            </div>
            <div
              className={`w-6 h-6 mx-auto rounded flex items-center justify-center ${
                item.value
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {item.value ? (
                <LuCheck className="w-4 h-4" />
              ) : (
                <LuX className="w-4 h-4" />
              )}
            </div>
          </div>
        ))}
      </div>
      {!status.hasPermission && onRequestPermission && (
        <button
          onClick={onRequestPermission}
          className="mt-3 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium"
        >
          Request Permission
        </button>
      )}
    </div>
  );
}