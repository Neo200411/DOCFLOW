import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { mockProjects } from '../data/mockProjects';
import { useDocuments } from '../context/DocumentContext';
import SourcePanel from '../components/sources/SourcePanel';
import ChatPanel from '../components/chat/ChatPanel';
import StudioPanel from '../components/studio/StudioPanel';
import Badge from '../components/ui/Badge';

const ProjectWorkspace = () => {
  const { projectId } = useParams();
  const { documents } = useDocuments();
  
  // Find project in mock data (if it was created in this session, it won't be in mockProjects, 
  // but we can fallback to a generated one for the prototype since state isn't persisted)
  const project = mockProjects.find(p => p.id === projectId) || {
    id: projectId,
    name: 'New Project',
    status: 'Active'
  };

  const projectDocs = documents.filter(d => d.projectId === projectId);

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-200 mb-2">Project not found</h2>
        <Link to="/" className="text-primary hover:underline">Return to Projects</Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Workspace Header */}
      <div className="h-14 border-b border-border bg-background px-6 flex items-center gap-4 shrink-0">
        <Link to="/" className="text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-1 text-sm">
          <ArrowLeft size={16} />
          All Projects
        </Link>
        <div className="w-px h-4 bg-border"></div>
        <h1 className="font-semibold text-gray-100">{project.name}</h1>
        <Badge variant={project.status === 'Active' ? 'active' : 'neutral'}>
          {project.status}
        </Badge>
      </div>

      {/* 3-Column Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        <div className="w-full lg:w-[30%] shrink-0 h-[500px] lg:h-full">
          <SourcePanel documents={projectDocs} />
        </div>
        <div className="w-full lg:w-[40%] shrink-0 h-[500px] lg:h-full border-t border-border lg:border-t-0">
          <ChatPanel />
        </div>
        <div className="w-full lg:w-[30%] shrink-0 h-[500px] lg:h-full border-t border-border lg:border-t-0">
          <StudioPanel />
        </div>
      </div>
    </div>
  );
};

export default ProjectWorkspace;
