import React, { createContext, useContext, useState } from 'react';
import { mockDocuments as initialDocs } from '../data/mockDocuments';

const DocumentContext = createContext();

export const useDocuments = () => useContext(DocumentContext);

export const DocumentProvider = ({ children }) => {
  const [documents, setDocuments] = useState(initialDocs);

  const addDocument = (doc) => {
    setDocuments(prev => [...prev, doc]);
  };

  return (
    <DocumentContext.Provider value={{ documents, addDocument }}>
      {children}
    </DocumentContext.Provider>
  );
};
