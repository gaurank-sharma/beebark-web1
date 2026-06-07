import React, { createContext, useContext, useState } from 'react';

// Small UI state shared across the app shell (e.g. mobile sidebar drawer).
const UIContext = createContext({ sidebarOpen: false, setSidebarOpen: () => {} });

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <UIContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      {children}
    </UIContext.Provider>
  );
};
