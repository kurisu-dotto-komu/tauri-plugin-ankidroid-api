import React, { useState, useEffect } from "react";
import {
  getModels,
  createModel,
  type Model,
  type CreateModelRequest,
} from "ankidroid-api-client";

interface ModelManagerProps {
  available: boolean;
}

export const ModelManager: React.FC<ModelManagerProps> = ({ available }) => {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [modelName, setModelName] = useState("");
  const [fields, setFields] = useState<string[]>(["Front", "Back"]);

  useEffect(() => {
    if (available) {
      fetchModels();
    }
  }, [available]);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const fetchedModels = await getModels();
      setModels(fetchedModels);
      setError("");
    } catch (error) {
      setError(`Error fetching models: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModel = async () => {
    if (!modelName.trim()) {
      setError("Please enter a model name");
      return;
    }

    if (fields.some(field => !field.trim())) {
      setError("Please fill in all field names");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const request: CreateModelRequest = {
        name: modelName.trim(),
        fields: fields.filter(field => field.trim()),
      };

      const result = await createModel(request);
      
      if (result.success) {
        await fetchModels(); // Refresh models list
        setModelName(""); // Reset form
        setFields(["Front", "Back"]);
      } else {
        setError(result.error || "Failed to create model");
      }
    } catch (error) {
      setError(`Error creating model: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (index: number, value: string) => {
    const newFields = [...fields];
    newFields[index] = value;
    setFields(newFields);
  };

  const handleAddField = () => {
    setFields([...fields, ""]);
  };

  const handleRemoveField = (index: number) => {
    if (fields.length > 1) {
      setFields(fields.filter((_, i) => i !== index));
    }
  };

  const parseFieldNames = (fieldNamesString: string): string[] => {
    // AnkiDroid typically stores field names as JSON array or comma-separated string
    try {
      const parsed = JSON.parse(fieldNamesString);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // If not JSON, try comma-separated
      return fieldNamesString.split(',').map(name => name.trim()).filter(name => name);
    }
    return [fieldNamesString];
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
      <h2>Model Manager</h2>

      {/* Create Model Form */}
      <div style={{ 
        marginBottom: "30px", 
        padding: "20px", 
        border: "1px solid #ccc", 
        borderRadius: "8px",
        backgroundColor: "#f9f9f9"
      }}>
        <h3>Create New Model</h3>
        
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Model Name:
          </label>
          <input
            type="text"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="Enter model name (e.g., Basic, Cloze)"
            style={{ width: "100%", padding: "8px", fontSize: "14px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Field Names:
          </label>
          {fields.map((field, index) => (
            <div key={index} style={{ display: "flex", marginBottom: "8px", alignItems: "center" }}>
              <input
                type="text"
                value={field}
                onChange={(e) => handleFieldChange(index, e.target.value)}
                placeholder={`Field ${index + 1} name`}
                style={{ flex: 1, padding: "8px", marginRight: "8px", fontSize: "14px" }}
              />
              {fields.length > 1 && (
                <button
                  onClick={() => handleRemoveField(index)}
                  style={{ 
                    padding: "8px 12px", 
                    backgroundColor: "#dc3545", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            onClick={handleAddField}
            style={{
              padding: "8px 16px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            Add Field
          </button>
        </div>

        <button
          onClick={handleCreateModel}
          disabled={loading || !modelName.trim() || fields.some(f => !f.trim())}
          style={{
            padding: "12px 24px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading || !modelName.trim() || fields.some(f => !f.trim()) ? "not-allowed" : "pointer",
            fontSize: "16px",
            opacity: loading || !modelName.trim() || fields.some(f => !f.trim()) ? 0.6 : 1
          }}
        >
          {loading ? "Creating..." : "Create Model"}
        </button>

        <div style={{ marginTop: "10px", fontSize: "14px", color: "#6c757d" }}>
          <strong>Note:</strong> Model creation is not supported via the ContentProvider API. 
          This feature requires the AddContentApi and may not work in this implementation.
        </div>
      </div>

      {/* Models List */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3>Available Models ({models.length})</h3>
          <button
            onClick={fetchModels}
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

        {models.length > 0 ? (
          <div style={{ display: "grid", gap: "15px" }}>
            {models.map((model) => (
              <div
                key={model.id}
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
                      {model.name}
                    </div>
                    <div style={{ fontSize: "14px", color: "#6c757d", marginBottom: "8px" }}>
                      <strong>ID:</strong> {model.id} | <strong>Number of Cards:</strong> {model.numCards}
                    </div>
                  </div>
                  <div style={{ 
                    padding: "4px 12px", 
                    backgroundColor: "#e9ecef", 
                    borderRadius: "12px", 
                    fontSize: "12px",
                    fontWeight: "bold"
                  }}>
                    Model
                  </div>
                </div>

                <div>
                  <strong>Field Names:</strong>
                  <div style={{ marginTop: "4px" }}>
                    {parseFieldNames(model.fieldNames).map((fieldName, index) => (
                      <span
                        key={index}
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          backgroundColor: "#e3f2fd",
                          marginRight: "4px",
                          marginBottom: "4px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          border: "1px solid #bbdefb"
                        }}
                      >
                        {fieldName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: "center", color: "#6c757d", marginTop: "40px" }}>
            No models found. Create your first model using the form above, or ensure AnkiDroid has some note types configured.
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

export default ModelManager;