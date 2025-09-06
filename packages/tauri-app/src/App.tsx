import { useState } from "react";
import Providers from "./providers/Providers";
import AppRouter from "./controllers/AppRouter";
import type { TabType } from "./types/navigation";

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("notes");

  return (
    <Providers>
      <AppRouter
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </Providers>
  );
}

export default App;