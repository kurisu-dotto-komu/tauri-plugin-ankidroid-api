import type { TabType } from "../types/navigation";
import { useAnkiContext } from "../contexts/AnkiContext";

// Components
import NoteManagerWrapper from "../components/wrappers/NoteManagerWrapper";
import ModelManagerWrapper from "../components/wrappers/ModelManagerWrapper";
import AnkiConnectionWizard from "../components/AnkiConnectionWizard";
import TodoPlaceholder from "../components/TodoPlaceholder";
import GreetTab from "../components/GreetTab";
import AppLayout from "../layouts/AppLayout";
import { APP_TABS } from "../config/tabs";
import { ErrorToast } from "../components/ErrorToast";

interface AppRouterProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function AppRouter({
  activeTab,
  onTabChange,
}: AppRouterProps) {
  const { status, isConnected, checkConnection, requestPermission } = useAnkiContext();

  const renderContent = () => {
    if (!isConnected) {
      return (
        <AnkiConnectionWizard
          status={status}
          onRequestPermission={requestPermission}
          onCheckConnection={checkConnection}
        />
      );
    }

    switch (activeTab) {
    case "greet":
      return <GreetTab />;

    case "notes":
      return <NoteManagerWrapper />;

    case "models":
      return <ModelManagerWrapper />;

    case "decks":
      return <TodoPlaceholder title="Decks" />;

    case "cards":
      return <TodoPlaceholder title="Cards" />;

    case "media":
      return <TodoPlaceholder title="Media" />;

    case "api-test":
      return <TodoPlaceholder title="API Test" />;

    default:
      return <div>Unknown tab</div>;
    }
  };

  return (
    <>
      <ErrorToast />
      <AppLayout
        tabs={APP_TABS}
        activeTab={activeTab}
        onTabChange={onTabChange}
      >
        {renderContent()}
      </AppLayout>
    </>
  );
}