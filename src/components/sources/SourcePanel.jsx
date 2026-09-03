import React from 'react';
import { STAGES } from '../../constants/stages';
import StageSection from './StageSection';

const SourcePanel = ({ documents = [] }) => {
  // Group documents by stage
  const groupedDocs = documents.reduce((acc, doc) => {
    if (!acc[doc.stage]) acc[doc.stage] = [];
    acc[doc.stage].push(doc);
    return acc;
  }, {});

  // Only get stages that have documents, but maintain STAGES order
  const activeStages = STAGES.filter(stage => groupedDocs[stage] && groupedDocs[stage].length > 0);

  return (
    <div className="h-full flex flex-col bg-surface border-r border-border">
      <div className="p-4 border-b border-border/50">
        <h2 className="text-lg font-semibold text-gray-100">Sources</h2>
        <p className="text-sm text-gray-400 mt-1">Project documents</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {activeStages.length > 0 ? (
          activeStages.map(stage => (
            <StageSection 
              key={stage} 
              stage={stage} 
              documents={groupedDocs[stage]} 
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            No documents found for this project.
          </div>
        )}
      </div>
    </div>
  );
};

export default SourcePanel;
