import React, { useState, useEffect } from "react";
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  getModels,
  getDecks,
  type Note,
  type Model,
  type Deck,
  type CreateNoteRequest,
  type UpdateNoteRequest,
  type DeleteNoteRequest,
} from "ankidroid-api-client";
import { LuCircleX, LuFileText, LuCircleCheck } from "react-icons/lu";
import { useErrorNotification } from "../contexts/ErrorNotificationContext";

interface NoteManagerProps {
  available: boolean;
}

export const NoteManager: React.FC<NoteManagerProps> = ({ available }) => {
  const { addError } = useErrorNotification();
  const [notes, setNotes] = useState<Note[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string>("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  
  // Form state for creating/editing notes
  const [formState, setFormState] = useState<{
    modelId: number;
    deckId?: number;
    fields: string[];
    tags: string[];
  }>({
    modelId: 0,
    deckId: undefined,
    fields: [],
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (available) {
      fetchNotes();
      fetchModels();
      fetchDecks();
    }
  }, [available]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const fetchedNotes = await getNotes({ limit: 50 });
      setNotes(fetchedNotes);
    } catch (error) {
      addError(`Error fetching notes: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async () => {
    try {
      console.log("Fetching models...");
      const fetchedModels = await getModels();
      console.log("Fetched models:", fetchedModels);
      setModels(fetchedModels);
      if (fetchedModels.length > 0 && formState.modelId === 0) {
        const firstModel = fetchedModels[0];
        const fieldCount = parseFieldNames(firstModel.fieldNames).length;
        setFormState(prev => ({ 
          ...prev, 
          modelId: firstModel.id,
          fields: new Array(fieldCount).fill("")
        }));
      }
    } catch (error) {
      console.error("Error fetching models:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      addError(`Failed to fetch models: ${errorMessage}`);
    }
  };
  
  const parseFieldNames = (fieldNamesString: string): string[] => {
    // AnkiDroid stores field names as JSON array string
    try {
      const parsed = JSON.parse(fieldNamesString);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // If not JSON, try comma-separated
      if (fieldNamesString.includes(',')) {
        return fieldNamesString.split(',').map(name => name.trim()).filter(name => name);
      }
    }
    return ["Front", "Back"]; // Default fallback
  };

  const fetchDecks = async () => {
    try {
      const fetchedDecks = await getDecks();
      setDecks(fetchedDecks);
    } catch (error) {
      console.error("Error fetching decks:", error);
      addError(`Error fetching decks: ${error}`);
    }
  };

  const handleCreateNote = async () => {
    if (!formState.modelId || formState.fields.some(f => !f.trim())) {
      addError("Please select a model and fill in all fields");
      return;
    }

    try {
      setLoading(true);

      const request: CreateNoteRequest = {
        modelId: formState.modelId,
        deckId: formState.deckId,
        fields: formState.fields,
        tags: formState.tags,
      };

      const result = await createNote(request);
      
      if (result.success) {
        await fetchNotes(); // Refresh notes list
        // Reset form
        const firstModel = models.length > 0 ? models[0] : null;
        const fieldCount = firstModel ? parseFieldNames(firstModel.fieldNames).length : 0;
        setFormState({
          modelId: firstModel ? firstModel.id : 0,
          deckId: undefined,
          fields: new Array(fieldCount).fill(""),
          tags: [],
        });
        setTagInput("");
        setSuccess("Note created successfully!");
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000);
      } else {
        addError(result.error || "Failed to create note");
        setSuccess("");
      }
    } catch (error) {
      addError(`Error creating note: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote) return;

    try {
      setLoading(true);

      const request: UpdateNoteRequest = {
        noteId: editingNote.id,
        fields: formState.fields,
        tags: formState.tags,
      };

      const result = await updateNote(request);
      
      if (result.success) {
        await fetchNotes(); // Refresh notes list
        setEditingNote(null);
        // Reset form
        const firstModel = models.length > 0 ? models[0] : null;
        const fieldCount = firstModel ? parseFieldNames(firstModel.fieldNames).length : 0;
        setFormState({
          modelId: firstModel ? firstModel.id : 0,
          deckId: undefined,
          fields: new Array(fieldCount).fill(""),
          tags: [],
        });
        setTagInput("");
      } else {
        addError(result.error || "Failed to update note");
      }
    } catch (error) {
      addError(`Error updating note: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      setLoading(true);

      const request: DeleteNoteRequest = { noteId };
      const result = await deleteNote(request);
      
      if (result.success) {
        await fetchNotes(); // Refresh notes list
      } else {
        addError(result.error || "Failed to delete note");
      }
    } catch (error) {
      addError(`Error deleting note: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setFormState({
      modelId: formState.modelId, // Keep current model selection
      deckId: formState.deckId,
      fields: [...note.fields],
      tags: [...note.tags],
    });
    setTagInput(note.tags.join(", "));
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setFormState({
      modelId: models.length > 0 ? models[0].id : 0,
      deckId: undefined,
      fields: ["", ""],
      tags: [],
    });
    setTagInput("");
  };

  const handleFieldChange = (index: number, value: string) => {
    const newFields = [...formState.fields];
    newFields[index] = value;
    setFormState(prev => ({ ...prev, fields: newFields }));
  };


  const handleTagInputChange = (value: string) => {
    setTagInput(value);
    const tags = value.split(",").map(tag => tag.trim()).filter(tag => tag);
    setFormState(prev => ({ ...prev, tags }));
  };

  if (!available) {
    return (
      <div className="text-center py-8 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <LuCircleX className="w-8 h-8 text-red-600" />
        </div>
        <p className="text-gray-600 text-sm">AnkiDroid API is not available</p>
        <p className="text-gray-500 text-xs mt-1">Please ensure AnkiDroid is installed and permissions are granted</p>
      </div>
    );
  }

  return (
    <div>
      {/* Create/Edit Note Form */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-xl">{editingNote ? "✏️" : "➕"}</span>
          {editingNote ? "Edit Note" : "Create New Note"}
        </h3>
        
        {!editingNote && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model:
            </label>
            <select
              value={formState.modelId}
              onChange={(e) => {
                const modelId = Number(e.target.value);
                const selectedModel = models.find(m => m.id === modelId);
                if (selectedModel) {
                  const fieldNames = parseFieldNames(selectedModel.fieldNames);
                  setFormState(prev => ({ 
                    ...prev, 
                    modelId,
                    fields: new Array(fieldNames.length).fill("")
                  }));
                } else {
                  setFormState(prev => ({ ...prev, modelId }));
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value={0}>Select a model...</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deck (Optional):
          </label>
          <select
            value={formState.deckId || ""}
            onChange={(e) => setFormState(prev => ({ 
              ...prev, 
              deckId: e.target.value ? Number(e.target.value) : undefined 
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Default deck</option>
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name}
              </option>
            ))}
          </select>
        </div>

        {formState.modelId > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fields:
            </label>
            {(() => {
              const selectedModel = models.find(m => m.id === formState.modelId);
              const fieldNames = selectedModel ? parseFieldNames(selectedModel.fieldNames) : [];
              
              return formState.fields.map((field, index) => (
                <div key={index} className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {fieldNames[index] || `Field ${index + 1}`}:
                  </label>
                  <input
                    type="text"
                    value={field}
                    onChange={(e) => handleFieldChange(index, e.target.value)}
                    placeholder={`Enter ${fieldNames[index] || 'content'}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              ));
            })()}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags (comma-separated):
          </label>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => handleTagInputChange(e.target.value)}
            placeholder="tag1, tag2, tag3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={editingNote ? handleUpdateNote : handleCreateNote}
            disabled={loading || formState.modelId === 0}
            className={`flex-1 px-4 py-3 rounded-lg font-medium text-white transition-colors ${
              editingNote 
                ? "bg-amber-500 hover:bg-amber-600 active:bg-amber-700" 
                : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
            } ${
              loading || formState.modelId === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Processing..." : (editingNote ? "Update Note" : "Create Note")}
          </button>
          
          {editingNote && (
            <button
              onClick={handleCancelEdit}
              className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 active:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Notes List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="text-xl">📝</span>
            Notes ({notes.length})
          </h3>
          <button
            onClick={fetchNotes}
            disabled={loading}
            className={`px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 active:bg-cyan-700 transition-colors font-medium text-sm ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {notes.length > 0 ? (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs text-gray-500 font-medium">ID: {note.id}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditNote(note)}
                      className="px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 active:bg-amber-700 transition-colors text-xs font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      disabled={loading}
                      className={`px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors text-xs font-medium ${
                        loading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {note.fields.map((field, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-2.5">
                      <div className="text-xs text-gray-500 font-medium mb-1">Field {index + 1}</div>
                      <div className="text-sm text-gray-800">{field}</div>
                    </div>
                  ))}
                </div>

                {note.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {note.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {note.sfld && (
                  <div className="mt-2 text-xs text-gray-500">
                    Sort: {note.sfld}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <LuFileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">No notes found</p>
            <p className="text-gray-400 text-xs mt-1">Create your first note using the form above</p>
          </div>
        )}
      </div>

      {/* Success Display */}
      {success && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <LuCircleCheck className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-green-800">{success}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteManager;