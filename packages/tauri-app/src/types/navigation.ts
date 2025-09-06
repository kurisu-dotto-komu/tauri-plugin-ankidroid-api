export type TabType =
  | "greet"
  | "notes"
  | "models"
  | "decks"
  | "cards"
  | "media"
  | "api-test";

export interface Tab {
  key: string;
  label: string;
  icon: string;
}