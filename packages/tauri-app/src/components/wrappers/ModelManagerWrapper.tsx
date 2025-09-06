import ModelManager from "../ModelManager";
import { useAnkiContext } from "../../contexts/AnkiContext";

export default function ModelManagerWrapper() {
  const { status } = useAnkiContext();
  return <ModelManager available={status?.available || false} />;
}