import React from 'react';
import TemplateCard from './TemplateCard';
import UploadDocumentCard from './UploadDocumentCard';

const StudioPanel = () => {
  return (
    <div className="h-full flex flex-col bg-surface lg:border-l border-border">
      <div className="p-4 border-b border-border/50">
        <h2 className="text-lg font-semibold text-gray-100">Studio</h2>
        <p className="text-sm text-gray-400 mt-1">Create project documents using AI-powered templates.</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Document Templates</h3>
          <TemplateCard 
            templateId="prd" 
            title="PRD" 
            description="Product Requirements Document" 
          />
          <TemplateCard 
            templateId="ard" 
            title="ARD" 
            description="Architecture Requirements Document" 
          />
          <TemplateCard 
            templateId="test-plan" 
            title="Test Plan" 
            description="Quality Assurance Test Plan" 
          />
          <TemplateCard 
            templateId="brd" 
            title="Business Requirements" 
            description="Business Requirements Document" 
          />
        </div>
        
        <UploadDocumentCard />
      </div>
    </div>
  );
};

export default StudioPanel;
