import React, { useEffect, useState } from "react";
import { useErrorNotification } from "../contexts/ErrorNotificationContext";
import { M3 } from "tauri-plugin-m3";

export const ErrorToast: React.FC = () => {
  const { errors, removeError } = useErrorNotification();
  const [isExpanded, setIsExpanded] = useState(false);
  const [bottomInset, setBottomInset] = useState(0);

  const visibleErrors = isExpanded ? errors : errors.slice(0, 1);
  const hiddenCount = errors.length - 1;

  useEffect(() => {
    const getNavigationBarHeight = async () => {
      try {
        // Wait for the Android view to be fully ready
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Get navigation bar insets
        const insets = await M3.getInsets() as any;
        
        if (insets && typeof insets === 'object') {
          // Use adjustedInsetBottom which is already density-adjusted
          const bottomInset = insets.adjustedInsetBottom || 0;
          setBottomInset(bottomInset);
        } else {
          // Fallback for 3-button navigation
          setBottomInset(48);
        }
      } catch (error) {
        // Fallback to standard Android navigation bar height
        setBottomInset(48);
      }
    };

    getNavigationBarHeight();
  }, []);

  useEffect(() => {
    if (errors.length === 0) {
      setIsExpanded(false);
    }
  }, [errors.length]);

  if (errors.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed left-0 right-0 z-50"
      style={{
        bottom: `${bottomInset}px`,
        padding: "1em",
      }}
    >
      <div className="max-w-md mx-auto space-y-2">
        {visibleErrors.map((error, index) => (
          <div
            key={error.id}
            className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg animate-slide-in-up"
            style={{
              animation: index === 0 ? "slideInUp 0.3s ease-out" : undefined,
            }}
          >
            <div className="flex items-start">
              <div className="flex-1">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-red-600 mr-2 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm font-medium text-red-800">Error</p>
                </div>
                <p className="mt-1 text-sm text-red-700 break-words overflow-hidden" title={error.message} style={{display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any}}>{error.message}</p>
              </div>
              <button
                onClick={() => removeError(error.id)}
                className="ml-4 flex-shrink-0 inline-flex text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded"
                aria-label="Dismiss error"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {!isExpanded && hiddenCount > 0 && (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full bg-red-100 hover:bg-red-200 text-red-800 text-sm font-medium py-2 px-4 rounded-lg transition-colors"
          >
            +{hiddenCount} more error{hiddenCount > 1 ? "s" : ""}
          </button>
        )}

        {isExpanded && errors.length > 1 && (
          <button
            onClick={() => setIsExpanded(false)}
            className="w-full bg-red-100 hover:bg-red-200 text-red-800 text-sm font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Show less
          </button>
        )}
      </div>
    </div>
  );
};

const style = document.createElement("style");
style.textContent = `
  @keyframes slideInUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .animate-slide-in-up {
    animation: slideInUp 0.3s ease-out;
  }
`;
document.head.appendChild(style);
