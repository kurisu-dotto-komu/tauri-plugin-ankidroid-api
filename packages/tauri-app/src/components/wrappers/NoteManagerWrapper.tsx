import NoteManager from "../NoteManager";
import { useAnkiContext } from "../../contexts/AnkiContext";

export default function NoteManagerWrapper() {
  const { status } = useAnkiContext();
  return <NoteManager available={status?.available || false} />;
}