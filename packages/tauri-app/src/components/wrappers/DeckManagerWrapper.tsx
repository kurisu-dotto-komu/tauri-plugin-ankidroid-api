import DeckManager from "../DeckManager";
import { useAnkiContext } from "../../contexts/AnkiContext";

export default function DeckManagerWrapper() {
  const { status } = useAnkiContext();
  return <DeckManager available={status?.available || false} />;
}