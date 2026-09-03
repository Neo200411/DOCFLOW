import React from 'react';
import { PenTool } from 'lucide-react';

const StudioPlaceholder = () => {
  return (
    <div className="h-full flex flex-col bg-surface border-l border-border">
      <div className="p-4 border-b border-border/50">
        <h2 className="text-lg font-semibold text-gray-100">Studio</h2>
        <p className="text-sm text-gray-400 mt-1">Document creation & drafting</p>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
        <PenTool size={48} className="text-border mb-4" />
        <h3 className="text-gray-300 font-medium mb-2">Studio is empty</h3>
        <p className="text-sm">Drafting and document creation tools will appear here.</p>
      </div>
    </div>
  );
};

export default StudioPlaceholder;
