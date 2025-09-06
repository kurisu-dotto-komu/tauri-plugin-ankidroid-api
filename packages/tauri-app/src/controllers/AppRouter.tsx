import type { TabType } from "../types/navigation";
import { useAnkiContext } from "../contexts/AnkiContext";

// Components
import NoteManagerWrapper from "../components/wrappers/NoteManagerWrapper";
import DeckManagerWrapper from "../components/wrappers/DeckManagerWrapper";
import ModelManagerWrapper from "../components/wrappers/ModelManagerWrapper";
import CardManagerWrapper from "../components/wrappers/CardManagerWrapper";
import MediaManagerWrapper from "../components/wrappers/MediaManagerWrapper";
import AnkiConnectionWizard from "../components/AnkiConnectionWizard";
import ApiTestTab from "../components/ApiTestTab";
import GreetTab from "../components/GreetTab";
import AppLayout from "../layouts/AppLayout";
import { APP_TABS } from "../config/tabs";

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
      return <DeckManagerWrapper />;

    case "cards":
      return <CardManagerWrapper />;

    case "media":
      return <MediaManagerWrapper />;

    case "api-test":
      return <ApiTestTab />;

    default:
      return <div>Unknown tab</div>;
    }
  };

  return (
    <AppLayout
      tabs={APP_TABS}
      activeTab={activeTab}
      onTabChange={onTabChange}
    >
      {renderContent()}
    </AppLayout>
  );
}