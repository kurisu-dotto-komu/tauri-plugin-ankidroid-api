import React, { useState, useEffect } from "react";
import {
  getCards,
  updateCard,
  reviewCard,
  getNotes,
  getDecks,
  type Card,
  type Note,
  type Deck,
  type UpdateCardRequest,
  type ReviewCardRequest,
  type GetCardsOptions,
} from "ankidroid-api-client";

interface CardManagerProps {
  available: boolean;
}

export const CardManager: React.FC<CardManagerProps> = ({ available }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedNoteId, setSelectedNoteId] = useState<number | undefined>();
  const [reviewingCard, setReviewingCard] = useState<Card | null>(null);

  useEffect(() => {
    if (available) {
      fetchNotes();
      fetchDecks();
      fetchCards();
    }
  }, [available]);

  const fetchCards = async (noteId?: number) => {
    try {
      setLoading(true);
      const options: GetCardsOptions = noteId ? { noteId } : {};
      const fetchedCards = await getCards(options);
      setCards(fetchedCards);
      setError("");
    } catch (error) {
      setError(`Error fetching cards: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const fetchedNotes = await getNotes({ limit: 50 });
      setNotes(fetchedNotes);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const fetchDecks = async () => {
    try {
      const fetchedDecks = await getDecks();
      setDecks(fetchedDecks);
    } catch (error) {
      console.error("Error fetching decks:", error);
    }
  };

  const handleNoteFilterChange = (noteId: string) => {
    const id = noteId ? Number(noteId) : undefined;
    setSelectedNoteId(id);
    fetchCards(id);
  };

  const handleMoveCard = async (card: Card, newDeckId: number) => {
    try {
      setLoading(true);
      setError("");

      const request: UpdateCardRequest = {
        noteId: card.noteId,
        cardOrd: card.ord,
        deckId: newDeckId,
      };

      const result = await updateCard(request);
      
      if (result.success) {
        await fetchCards(selectedNoteId); // Refresh cards list
      } else {
        setError(result.error || "Failed to move card");
      }
    } catch (error) {
      setError(`Error moving card: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewCard = async (card: Card, ease: number) => {
    try {
      setLoading(true);
      setError("");

      const request: ReviewCardRequest = {
        noteId: card.noteId,
        cardOrd: card.ord,
        ease: ease,
      };

      const result = await reviewCard(request);
      
      if (result.success) {
        setReviewingCard(null);
        // Note: In a real app, this might update card scheduling info
      } else {
        setError(result.error || "Failed to review card");
      }
    } catch (error) {
      setError(`Error reviewing card: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const getNoteName = (noteId: number): string => {
    const note = notes.find(n => n.id === noteId);
    return note ? note.fields[0] || `Note ${noteId}` : `Note ${noteId}`;
  };

  const getDeckName = (deckId: number): string => {
    const deck = decks.find(d => d.id === deckId);
    return deck ? deck.name : `Deck ${deckId}`;
  };

  const easeLabels = {
    1: "Again",
    2: "Hard", 
    3: "Good",
    4: "Easy"
  };

  if (!available) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>AnkiDroid API is not available. Please ensure AnkiDroid is installed and permissions are granted.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Card Manager</h2>

      {/* Filter Controls */}
      <div style={{ 
        marginBottom: "30px", 
        padding: "20px", 
        border: "1px solid #ccc", 
        borderRadius: "8px",
        backgroundColor: "#f9f9f9"
      }}>
        <h3>Filter Cards</h3>
        
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Filter by Note:
          </label>
          <select
            value={selectedNoteId || ""}
            onChange={(e) => handleNoteFilterChange(e.target.value)}
            style={{ width: "100%", padding: "8px", fontSize: "14px" }}
          >
            <option value="">All cards</option>
            {notes.map((note) => (
              <option key={note.id} value={note.id}>
                {getNoteName(note.id)} (ID: {note.id})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => fetchCards(selectedNoteId)}
          disabled={loading}
          style={{
            padding: "8px 16px",
            backgroundColor: "#17a2b8",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? "Loading..." : "Refresh Cards"}
        </button>
      </div>

      {/* Cards List */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3>Cards ({cards.length})</h3>
        </div>

        {cards.length > 0 ? (
          <div style={{ display: "grid", gap: "15px" }}>
            {cards.map((card) => (
              <div
                key={`${card.noteId}-${card.ord}`}
                style={{
                  padding: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "5px" }}>
                      Card {card.ord + 1} - {getNoteName(card.noteId)}
                    </div>
                    <div style={{ fontSize: "14px", color: "#6c757d", marginBottom: "8px" }}>
                      <strong>Note ID:</strong> {card.noteId} | <strong>Deck:</strong> {getDeckName(card.deckId)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => setReviewingCard(card)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      Review
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: "10px" }}>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Question:</strong>
                    <div style={{ 
                      padding: "8px", 
                      backgroundColor: "#f8f9fa", 
                      marginTop: "4px", 
                      borderRadius: "4px",
                      fontSize: "14px",
                      minHeight: "40px"
                    }}>
                      {card.question || "No question content"}
                    </div>
                  </div>
                  
                  <div>
                    <strong>Answer:</strong>
                    <div style={{ 
                      padding: "8px", 
                      backgroundColor: "#e9ecef", 
                      marginTop: "4px", 
                      borderRadius: "4px",
                      fontSize: "14px",
                      minHeight: "40px"
                    }}>
                      {card.answer || "No answer content"}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "12px" }}>
                  <strong>Move to Deck:</strong>
                  <div style={{ display: "flex", alignItems: "center", marginTop: "4px", gap: "8px" }}>
                    <select
                      onChange={(e) => {
                        const newDeckId = Number(e.target.value);
                        if (newDeckId && newDeckId !== card.deckId) {
                          handleMoveCard(card, newDeckId);
                        }
                      }}
                      value={card.deckId}
                      style={{ flex: 1, padding: "6px", fontSize: "12px" }}
                    >
                      {decks.map((deck) => (
                        <option key={deck.id} value={deck.id}>
                          {deck.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: "center", color: "#6c757d", marginTop: "40px" }}>
            No cards found. {selectedNoteId ? "Try selecting a different note or clearing the filter." : "Ensure you have notes with cards in AnkiDroid."}
          </p>
        )}
      </div>

      {/* Review Modal */}
      {reviewingCard && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "8px",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "80%",
            overflow: "auto"
          }}>
            <h3>Review Card</h3>
            <div style={{ marginBottom: "20px" }}>
              <strong>Note:</strong> {getNoteName(reviewingCard.noteId)}
            </div>
            
            <div style={{ marginBottom: "20px" }}>
              <strong>Question:</strong>
              <div style={{ 
                padding: "12px", 
                backgroundColor: "#f8f9fa", 
                marginTop: "8px", 
                borderRadius: "4px",
                fontSize: "16px",
                minHeight: "60px"
              }}>
                {reviewingCard.question || "No question content"}
              </div>
            </div>
            
            <div style={{ marginBottom: "30px" }}>
              <strong>Answer:</strong>
              <div style={{ 
                padding: "12px", 
                backgroundColor: "#e9ecef", 
                marginTop: "8px", 
                borderRadius: "4px",
                fontSize: "16px",
                minHeight: "60px"
              }}>
                {reviewingCard.answer || "No answer content"}
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <strong>Rate your recall:</strong>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              {[1, 2, 3, 4].map((ease) => (
                <button
                  key={ease}
                  onClick={() => handleReviewCard(reviewingCard, ease)}
                  disabled={loading}
                  style={{
                    padding: "15px 10px",
                    backgroundColor: ease === 1 ? "#dc3545" : ease === 2 ? "#fd7e14" : ease === 3 ? "#28a745" : "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "bold",
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {ease}<br/>{easeLabels[ease as keyof typeof easeLabels]}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setReviewingCard(null)}
              style={{
                padding: "10px 20px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                width: "100%"
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{ 
          marginTop: "20px", 
          padding: "15px", 
          backgroundColor: "#f8d7da", 
          border: "1px solid #f5c6cb",
          borderRadius: "4px",
          color: "#721c24"
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default CardManager;