import { LuInfo } from "react-icons/lu";

interface NotConnectedViewProps {
  onCheckConnection: () => void;
  onRequestPermission: () => void;
  hasPermission?: boolean;
}

export default function NotConnectedView({ 
  onCheckConnection, 
  onRequestPermission,
  hasPermission = false 
}: NotConnectedViewProps) {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <LuInfo className="w-10 h-10 text-gray-400" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        AnkiDroid Not Connected
      </h2>
      <p className="text-gray-600 text-center mb-6 max-w-sm">
        {!hasPermission 
          ? "Please grant permission to access AnkiDroid to use this app."
          : "Make sure AnkiDroid is installed and running on your device."}
      </p>
      <div className="space-y-3 w-full max-w-xs">
        {!hasPermission && (
          <button
            onClick={onRequestPermission}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium"
          >
            Grant Permission
          </button>
        )}
        <button
          onClick={onCheckConnection}
          className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors font-medium"
        >
          Check Connection
        </button>
      </div>
    </div>
  );
}