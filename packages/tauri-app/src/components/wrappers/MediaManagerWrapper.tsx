import MediaManager from "../MediaManager";
import { useAnkiContext } from "../../contexts/AnkiContext";

export default function MediaManagerWrapper() {
  const { status } = useAnkiContext();
  return <MediaManager available={status?.available || false} />;
}