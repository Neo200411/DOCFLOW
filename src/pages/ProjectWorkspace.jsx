import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useDocuments } from '../context/DocumentContext';
import SourcePanel from '../components/sources/SourcePanel';
import ChatPanel from '../components/chat/ChatPanel';
import StudioPanel from '../components/studio/StudioPanel';
import Badge from '../components/ui/Badge';

const ProjectWorkspace = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { documents, loadDocumentsForProject, loading } = useDocuments();
  const [project, setProject] = useState(null);
  
  useEffect(() => {
    // 1. Fetch this project's details
    // Since we don't have a GET /projects/{id} endpoint yet, we could either 
    // fetch all projects and find it, or just mock the header for now, 
    // or rely on a new endpoint.
    // The prompt only asked to fetch documents, but let's quickly fetch projects to find this one.
    const loadProject = async () => {
      try {
        const res = await fetch('/api/projects', { credentials: 'include' });
        if (res.status === 401) { navigate('/login'); return; }
        if (res.ok) {
          const allProj = await res.json();
          const p = allProj.find(x => x.id === projectId);
          setProject(p || { id: projectId, name: 'Project Details Loading...', status: 'Active' });
        }
      } catch (err) {}
    };
    loadProject();
    
    // 2. Fetch documents
    if (projectId) {
      loadDocumentsForProject(projectId);
    }
  }, [projectId, navigate]);

  const projectDocs = documents.filter(d => d.projectId === projectId);

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-200 mb-2">Loading workspace...</h2>
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
