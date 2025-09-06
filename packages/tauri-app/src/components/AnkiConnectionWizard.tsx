import { useEffect } from "react";
import type { AnkiDroidStatus } from "ankidroid-api-client";
import { LuMonitor, LuInfo, LuTriangleAlert, LuLock, LuCircleCheck } from "react-icons/lu";

interface AnkiConnectionWizardProps {
  status: AnkiDroidStatus | null;
  onRequestPermission: () => void;
  onCheckConnection?: () => void;
}

// Reusable component for status cards
interface StatusCardProps {
  icon: React.ReactNode;
  iconColor: 'orange' | 'gray' | 'red' | 'yellow' | 'green';
  isPulsing?: boolean;
  title: string;
  description?: string;
  children?: React.ReactNode;
  version?: string;
}

function StatusCard({ icon, iconColor, isPulsing, title, description, children, version }: StatusCardProps) {
  const iconBgColors = {
    orange: 'bg-orange-100',
    gray: 'bg-gray-100',
    red: 'bg-red-100',
    yellow: 'bg-yellow-100',
    green: 'bg-green-100',
  };

  const iconTextColors = {
    orange: 'text-orange-500',
    gray: 'text-gray-400',
    red: 'text-red-500',
    yellow: 'text-yellow-600',
    green: 'text-green-500',
  };

  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center p-4">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${iconBgColors[iconColor]} ${isPulsing ? 'animate-pulse' : ''}`}>
        <div className={`${iconTextColors[iconColor]} [&>svg]:w-8 [&>svg]:h-8`}>
          {icon}
        </div>
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-gray-600 text-center mb-4 max-w-sm">
          {description}
        </p>
      )}
      {children}
      {version && (
        <p className="mt-4 text-xs text-gray-500 text-center">
          {version}
        </p>
      )}
    </div>
  );
}

// Reusable component for info boxes
interface InfoBoxProps {
  variant: 'orange' | 'gray' | 'yellow';
  title?: string;
  children: React.ReactNode;
}

function InfoBox({ variant, title, children }: InfoBoxProps) {
  const boxStyles = {
    orange: 'bg-orange-50 border border-orange-200',
    gray: 'bg-gray-50',
    yellow: 'bg-yellow-50 border border-yellow-200',
  };

  const titleStyles = {
    orange: 'text-sm font-medium text-orange-800 mb-2',
    gray: 'text-sm font-medium text-gray-700 mb-2',
    yellow: 'text-sm font-medium text-yellow-800 mb-2',
  };

  return (
    <div className={`rounded-lg p-4 max-w-sm ${boxStyles[variant]}`}>
      {title && <h3 className={titleStyles[variant]}>{title}</h3>}
      {children}
    </div>
  );
}


export default function AnkiConnectionWizard({ 
  status, 
  onRequestPermission,
  onCheckConnection
}: AnkiConnectionWizardProps) {
  // Check if we're in a non-Android environment
  const isAndroid = navigator.userAgent.includes("Android");
  const isTauriAvailable = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;

  // Auto-check connection only on Android when app gains focus (user returns from installing AnkiDroid or granting permission)
  useEffect(() => {
    if (!onCheckConnection) return;
    
    // Only set up auto-check on Android where status can actually change
    if (!isAndroid) return;

    // Check when window gains focus (user returns to app after installing or granting permission)
    const handleFocus = () => {
      // Check if we're showing states that can change
      if (status && (!status.installed || !status.hasPermission)) {
        onCheckConnection();
      }
    };

    // Check when document becomes visible (tab switch, app switch)
    const handleVisibilityChange = () => {
      if (!document.hidden && status && (!status.installed || !status.hasPermission)) {
        onCheckConnection();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onCheckConnection, status, isAndroid]);
  
  // Show non-Android environment message - only if not Android AND not in Tauri
  if (!isAndroid && !isTauriAvailable) {
    return (
      <StatusCard
        icon={<LuMonitor />}
        iconColor="orange"
        title="Android Device Required"
        description={`This app requires an Android device with AnkiDroid installed. It appears you're running this on ${!isAndroid ? 'a non-Android platform' : 'an unsupported environment'}.`}
        version={!isTauriAvailable ? "Tauri runtime not detected" : undefined}
      >
        <InfoBox variant="orange" title="Requirements:">
          <ul className="text-sm text-orange-700 space-y-1 list-disc list-inside">
            <li>Android device or emulator</li>
            <li>AnkiDroid app installed</li>
            <li>Tauri Android runtime</li>
          </ul>
        </InfoBox>
      </StatusCard>
    );
  }
  
  if (!status) {
    return (
      <StatusCard
        icon={<LuInfo />}
        iconColor="gray"
        isPulsing
        title="Checking AnkiDroid Connection..."
      />
    );
  }

  // Determine the current state
  if (!status.installed) {
    return (
      <StatusCard
        icon={<LuTriangleAlert />}
        iconColor="red"
        title="AnkiDroid Not Installed"
        description="AnkiDroid is not installed on this device. Please install AnkiDroid from the Google Play Store to use this app."
      >
        <InfoBox variant="gray" title="Installation Steps:">
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Open Google Play Store</li>
            <li>Search for "AnkiDroid"</li>
            <li>Install the app</li>
            <li>Return to this app</li>
          </ol>
        </InfoBox>
      </StatusCard>
    );
  }

  if (!status.hasPermission) {
    return (
      <StatusCard
        icon={<LuLock />}
        iconColor="yellow"
        title="Permission Required"
        description={`AnkiDroid ${status.version ? `v${status.version}` : ''} is installed but we need permission to access it.`}
      >
        <button
          onClick={onRequestPermission}
          className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium text-sm"
        >
          Grant Permission
        </button>
      </StatusCard>
    );
  }

  if (!status.providerReachable) {
    return (
      <StatusCard
        icon={<LuCircleCheck />}
        iconColor="green"
        title="AnkiDroid Connection Issue"
        description={`AnkiDroid ${status.version ? `v${status.version}` : ''} is installed and permission granted, but we cannot reach the AnkiDroid provider.`}
        version={status.version ? `AnkiDroid v${status.version}` : undefined}
      >
        <InfoBox variant="yellow">
          <p className="text-sm text-yellow-800">
            Please make sure AnkiDroid is running and try again.
          </p>
        </InfoBox>
      </StatusCard>
    );
  }

  // This shouldn't happen as available should be true at this point
  return (
    <StatusCard
      icon={<LuTriangleAlert />}
      iconColor="yellow"
      title="Connection Issue"
      description="There seems to be an issue connecting to AnkiDroid. Please check your setup."
      version={status.version ? `AnkiDroid v${status.version}` : undefined}
    />
  );
}