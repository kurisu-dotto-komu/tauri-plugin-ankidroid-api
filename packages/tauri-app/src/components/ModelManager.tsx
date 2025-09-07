import React, { useState, useEffect } from "react";
import clsx from "clsx";
import {
  getModels,
  createModel,
  deleteModel,
  type Model,
  type CreateModelRequest,
  type CreateModelResponse,
  type DeleteModelRequest,
  type DeleteModelResponse,
} from "ankidroid-api-client";
import { LuCircleX, LuFileText, LuCircleCheck, LuPlus, LuTrash2 } from "react-icons/lu";
import { useErrorNotification } from "../contexts/ErrorNotificationContext";

interface ModelManagerProps {
  available: boolean;
}

export const ModelManager: React.FC<ModelManagerProps> = ({ available }) => {
  const { addError } = useErrorNotification();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [success, setSuccess] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; model: Model | null }>({ show: false, model: null });
  
  // Form state for creating models
  const [formState, setFormState] = useState<{
    name: string;
    fields: string[];
  }>({
    name: "",
    fields: ["Front", "Back"],
  });

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
    } catch (error) {
      addError(`Error fetching models: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const parseFieldNames = (fieldNamesString: string): string[] => {
    try {
      const parsed = JSON.parse(fieldNamesString);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      if (fieldNamesString.includes(',')) {
        return fieldNamesString.split(',').map(name => name.trim()).filter(name => name);
      }
    }
    return ["Front", "Back"];
  };

  const handleCreateModel = async () => {
    if (!formState.name.trim()) {
      addError("Please enter a model name");
      return;
    }

    if (formState.fields.some(f => !f.trim())) {
      addError("Please fill in all field names");
      return;
    }

    try {
      setLoading(true);

      const request: CreateModelRequest = {
        name: formState.name,
        fields: formState.fields.filter(f => f.trim()),
      };

      const result = await createModel(request);
      
      if (result.success) {
        await fetchModels();
        // Reset form
        setFormState({
          name: "",
          fields: ["Front", "Back"],
        });
        setSuccess("Model created successfully!");
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000);
      } else {
        // Display the specific error message from the backend
        const errorMsg = result.error || "Failed to create model";
        console.error("Model creation failed:", errorMsg);
        addError(errorMsg);
        setSuccess("");
      }
    } catch (error) {
      // Better error handling for client-side errors
      const errorMsg = error instanceof Error 
        ? error.message 
        : typeof error === 'object' && error !== null
          ? JSON.stringify(error)
          : String(error);
      console.error("Error creating model:", error);
      addError(`Error creating model: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (index: number, value: string) => {
    const newFields = [...formState.fields];
    newFields[index] = value;
    setFormState(prev => ({ ...prev, fields: newFields }));
  };

  const addField = () => {
    setFormState(prev => ({
      ...prev,
      fields: [...prev.fields, ""],
    }));
  };

  const removeField = (index: number) => {
    if (formState.fields.length > 2) {
      const newFields = formState.fields.filter((_, i) => i !== index);
      setFormState(prev => ({ ...prev, fields: newFields }));
    }
  };

  const handleDeleteModel = async (model: Model) => {
    try {
      setDeleting(model.id);
      const result = await deleteModel({ modelId: model.id });
      
      if (result.success) {
        await fetchModels();
        setSuccess(`Model "${model.name}" deleted successfully!`);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorMsg = result.error || "Failed to delete model";
        addError(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error 
        ? error.message 
        : typeof error === 'object' && error !== null
          ? JSON.stringify(error)
          : String(error);
      console.error("Error deleting model:", error);
      addError(`Error deleting model: ${errorMsg}`);
    } finally {
      setDeleting(null);
      setDeleteConfirm({ show: false, model: null });
    }
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
      {/* Create Model Form */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-xl">➕</span>
          Create New Model
        </h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model Name:
          </label>
          <input
            type="text"
            value={formState.name}
            onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Basic, Cloze, Custom"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Fields:
            </label>
            <button
              onClick={addField}
              className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 active:bg-green-700 transition-colors text-xs font-medium flex items-center gap-1"
            >
              <LuPlus className="w-3 h-3" />
              Add Field
            </button>
          </div>
          
          {formState.fields.map((field, index) => (
            <div key={index} className="mb-3 flex gap-2">
              <input
                type="text"
                value={field}
                onChange={(e) => handleFieldChange(index, e.target.value)}
                placeholder={`Field ${index + 1}`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              {formState.fields.length > 2 && (
                <button
                  onClick={() => removeField(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors"
                >
                  <LuTrash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleCreateModel}
          disabled={loading || !formState.name.trim()}
          className={clsx(
            "w-full px-4 py-3 rounded-lg font-medium text-white transition-colors",
            "bg-blue-500 hover:bg-blue-600 active:bg-blue-700",
            (loading || !formState.name.trim()) && "opacity-50 cursor-not-allowed"
          )}
        >
          {loading ? "Creating..." : "Create Model"}
        </button>
      </div>

      {/* Models List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="text-xl">📋</span>
            Models ({models.length})
          </h3>
          <button
            onClick={fetchModels}
            disabled={loading}
            className={clsx(
              "px-4 py-2 rounded-lg font-medium text-sm text-white transition-colors",
              "bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700",
              loading && "opacity-50 cursor-not-allowed"
            )}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {models.length > 0 ? (
          <div className="space-y-3">
            {models.map((model) => {
              const fieldNames = Array.isArray(model.fieldNames) ? model.fieldNames : parseFieldNames(model.fieldNames);
              return (
                <div
                  key={model.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                >
                  <div className="mb-3">
                    <div className="mb-2">
                      <h4 className="text-base font-semibold text-gray-800 truncate" title={model.name}>{model.name}</h4>
                      <span className="text-xs text-gray-500 font-medium truncate block" title={`ID: ${model.id}`}>ID: {model.id}</span>
                    </div>
                    <div className="flex justify-end items-center">
                      <button
                        onClick={() => setDeleteConfirm({ show: true, model })}
                        disabled={deleting === model.id}
                        className="px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete Model"
                      >
                        {deleting === model.id ? (
                          <span className="text-xs">Deleting...</span>
                        ) : (
                          <LuTrash2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="text-xs text-gray-500 font-medium mb-1">Fields:</div>
                    <div className="flex flex-wrap gap-1">
                      {fieldNames.map((field, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium max-w-[120px] truncate"
                          title={field}
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <LuFileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">No models found</p>
            <p className="text-gray-400 text-xs mt-1">Create your first model using the form above</p>
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && deleteConfirm.model && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <LuTrash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Model</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete the model "<strong className="truncate inline-block max-w-[200px]" title={deleteConfirm.model.name}>{deleteConfirm.model.name}</strong>"? 
              This will also delete all {deleteConfirm.model.numCards} associated cards.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm({ show: false, model: null })}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteModel(deleteConfirm.model!)}
                disabled={deleting === deleteConfirm.model.id}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting === deleteConfirm.model.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelManager;