import React, { createContext, useContext, useState } from 'react';

const DocumentContext = createContext();

export const useDocuments = () => useContext(DocumentContext);

export const DocumentProvider = ({ children }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadDocumentsForProject = async (projectId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/documents`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        // Overwrite or append documents. For now, since it loads per project, just set them.
        // We'll filter by projectId in the workspace anyway, but let's just hold all loaded docs
        setDocuments(prev => {
          // Remove old docs for this project
          const filtered = prev.filter(d => d.projectId !== projectId);
          return [...filtered, ...data];
        });
      } else {
        console.error("Failed to fetch project documents:", res.status);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const addDocument = (doc) => {
    setDocuments(prev => [...prev, doc]);
  };

  return (
    <DocumentContext.Provider value={{ documents, loading, addDocument, loadDocumentsForProject }}>
      {children}
    </DocumentContext.Provider>
  );
};
