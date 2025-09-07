import { ReactNode } from "react";
import { AnkiProvider } from "../contexts/AnkiContext";
import { ErrorNotificationProvider } from "../contexts/ErrorNotificationContext";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ErrorNotificationProvider>
      <AnkiProvider>
        {children}
      </AnkiProvider>
    </ErrorNotificationProvider>
  );
}