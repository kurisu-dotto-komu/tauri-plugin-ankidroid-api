import React, { useState, useEffect } from "react";
import {
  getDecks,
  createDeck,
  type Deck,
  type CreateDeckRequest,
} from "ankidroid-api-client";

interface DeckManagerProps {
  available: boolean;
}

export const DeckManager: React.FC<DeckManagerProps> = ({ available }) => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [deckName, setDeckName] = useState("");

  useEffect(() => {
    if (available) {
      fetchDecks();
    }
  }, [available]);

  const fetchDecks = async () => {
    try {
      setLoading(true);
      const fetchedDecks = await getDecks();
      setDecks(fetchedDecks);
      setError("");
    } catch (error) {
      setError(`Error fetching decks: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeck = async () => {
    if (!deckName.trim()) {
      setError("Please enter a deck name");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const request: CreateDeckRequest = {
        name: deckName.trim(),
      };

      const result = await createDeck(request);
      
      if (result.success) {
        await fetchDecks(); // Refresh decks list
        setDeckName(""); // Reset form
      } else {
        setError(result.error || "Failed to create deck");
      }
    } catch (error) {
      setError(`Error creating deck: ${error}`);
    } finally {
      setLoading(false);
    }
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
      <h2>Deck Manager</h2>

      {/* Create Deck Form */}
      <div style={{ 
        marginBottom: "30px", 
        padding: "20px", 
        border: "1px solid #ccc", 
        borderRadius: "8px",
        backgroundColor: "#f9f9f9"
      }}>
        <h3>Create New Deck</h3>
        
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Deck Name:
          </label>
          <input
            type="text"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder="Enter deck name"
            style={{ width: "100%", padding: "8px", fontSize: "14px" }}
          />
        </div>

        <button
          onClick={handleCreateDeck}
          disabled={loading || !deckName.trim()}
          style={{
            padding: "12px 24px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading || !deckName.trim() ? "not-allowed" : "pointer",
            fontSize: "16px",
            opacity: loading || !deckName.trim() ? 0.6 : 1
          }}
        >
          {loading ? "Creating..." : "Create Deck"}
        </button>

        <div style={{ marginTop: "10px", fontSize: "14px", color: "#6c757d" }}>
          <strong>Note:</strong> Deck creation may have limited support via the ContentProvider API. 
          Some operations might require the AddContentApi.
        </div>
      </div>

      {/* Decks List */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3>Available Decks ({decks.length})</h3>
          <button
            onClick={fetchDecks}
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
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {decks.length > 0 ? (
          <div style={{ display: "grid", gap: "15px" }}>
            {decks.map((deck) => (
              <div
                key={deck.id}
                style={{
                  padding: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "5px" }}>
                      {deck.name}
                    </div>
                    <div style={{ fontSize: "14px", color: "#6c757d" }}>
                      <strong>ID:</strong> {deck.id}
                    </div>
                  </div>
                  <div style={{ 
                    padding: "4px 12px", 
                    backgroundColor: "#e9ecef", 
                    borderRadius: "12px", 
                    fontSize: "12px",
                    fontWeight: "bold"
                  }}>
                    Deck
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: "center", color: "#6c757d", marginTop: "40px" }}>
            No decks found. Create your first deck using the form above.
          </p>
        )}
      </div>

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

export default DeckManager;