import CardManager from "../CardManager";
import { useAnkiContext } from "../../contexts/AnkiContext";

export default function CardManagerWrapper() {
  const { status } = useAnkiContext();
  return <CardManager available={status?.available || false} />;
}