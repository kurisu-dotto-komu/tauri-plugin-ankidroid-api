import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ErrorNotification {
  id: string;
  message: string;
  timestamp: number;
}

interface ErrorNotificationContextType {
  errors: ErrorNotification[];
  addError: (message: string) => void;
  removeError: (id: string) => void;
  clearAllErrors: () => void;
}

const ErrorNotificationContext = createContext<ErrorNotificationContextType | undefined>(undefined);

interface ErrorNotificationProviderProps {
  children: ReactNode;
}

export const ErrorNotificationProvider: React.FC<ErrorNotificationProviderProps> = ({ children }) => {
  const [errors, setErrors] = useState<ErrorNotification[]>([]);

  const addError = useCallback((message: string) => {
    const newError: ErrorNotification = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      timestamp: Date.now(),
    };
    
    setErrors(prev => [newError, ...prev]);
  }, []);

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return (
    <ErrorNotificationContext.Provider 
      value={{ 
        errors, 
        addError, 
        removeError, 
        clearAllErrors 
      }}
    >
      {children}
    </ErrorNotificationContext.Provider>
  );
};

export const useErrorNotification = () => {
  const context = useContext(ErrorNotificationContext);
  if (!context) {
    throw new Error('useErrorNotification must be used within an ErrorNotificationProvider');
  }
  return context;
};