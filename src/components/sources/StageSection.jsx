import React from 'react';
import CollapsibleSection from '../ui/CollapsibleSection';
import DocumentItem from './DocumentItem';

const StageSection = ({ stage, documents }) => {
  if (!documents || documents.length === 0) return null;
  
  return (
    <CollapsibleSection 
      title={stage} 
      count={documents.length}
      badgeVariant="neutral"
      defaultExpanded={true}
      className="mb-4"
    >
      <div className="flex flex-col gap-1">
        {documents.map(doc => (
          <DocumentItem key={doc.id} document={doc} />
        ))}
      </div>
    </CollapsibleSection>
  );
};

export default StageSection;
