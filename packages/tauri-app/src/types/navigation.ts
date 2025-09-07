export type TabType =
  | "greet"
  | "notes"
  | "models"
  | "decks"
  | "cards"
  | "templates"
  | "media"
  | "api-test";

export interface Tab {
  key: string;
  label: string;
  icon: string;
}
