import React from 'react';
import { FileText, File, FileImage, FileSpreadsheet } from 'lucide-react';

const getFileIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'pdf': return <FileText className="text-red-400" size={16} />;
    case 'docx': return <File className="text-blue-400" size={16} />;
    case 'xlsx':
    case 'csv': return <FileSpreadsheet className="text-emerald-400" size={16} />;
    case 'png':
    case 'jpg': return <FileImage className="text-amber-400" size={16} />;
    default: return <FileText className="text-gray-400" size={16} />;
  }
};

const DocumentItem = ({ document }) => {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer group">
      <div className="mt-0.5">
        {getFileIcon(document.type)}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-200 truncate group-hover:text-primary-light transition-colors">
          {document.name}
        </h4>
        <p className="text-xs text-gray-500 mt-1">
          {document.size} &middot; {document.uploadedAt}
        </p>
      </div>
    </div>
  );
};

export default DocumentItem;
