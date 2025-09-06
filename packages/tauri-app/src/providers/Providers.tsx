import { ReactNode } from "react";
import { AnkiProvider } from "../contexts/AnkiContext";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AnkiProvider>
      {children}
    </AnkiProvider>
  );
}