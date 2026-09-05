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
  const [isAdmin, setIsAdmin] = useState(false);
  const [myAccess, setMyAccess] = useState(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const user = await res.json();
          setIsAdmin(user.is_org_admin === true);
        }
      } catch (err) {
        console.error(err);
      }
    };
    checkAuth();
    
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
      
      // Fetch access details
      fetch(`/api/projects/${projectId}/my-access`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
            if (data) {
                setMyAccess(data);
                setIsAdmin(data.is_admin);
            }
        });
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

  const handleRequestAccess = async (teamId) => {
    try {
      const res = await fetch('/api/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, team_id: teamId })
      });
      if (res.ok) {
        const data = await res.json();
        setMyAccess(prev => {
           if (!prev) return prev;
           return {
               ...prev,
               teams: prev.teams.map(t => t.id === teamId ? { ...t, request_status: data.status } : t)
           }
        });
      }
    } catch (err) {}
  };

  const renderAccessUI = () => {
      if (!myAccess) return null;
      if (myAccess.is_admin || myAccess.max_role === 'team_lead') {
          return <span className="text-sm text-green-400">You have full access</span>;
      }
      
      const contributorTeams = myAccess.teams.filter(t => t.role === 'contributor');
      if (contributorTeams.length === 0) return null; // Viewer only
      
      return (
          <div className="flex gap-2 items-center">
              {contributorTeams.map(t => {
                  if (t.request_status === 'approved') return <span key={t.id} className="text-sm text-green-400">{t.name}: Confidential Access Approved</span>;
                  if (t.request_status === 'pending') return <span key={t.id} className="text-sm text-yellow-400">{t.name}: Access Request Pending</span>;
                  if (t.request_status === 'denied') return <span key={t.id} className="text-sm text-red-400">{t.name}: Access Request Denied</span>;
                  return (
                      <button 
                        key={t.id}
                        onClick={() => handleRequestAccess(t.id)} 
                        className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded transition-colors">
                          Request Confidential Access ({t.name})
                      </button>
                  );
              })}
          </div>
      );
  };

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
        <div className="ml-4">
            {renderAccessUI()}
        </div>
        {isAdmin && (
          <Link to={`/projects/${projectId}/admin`} className="ml-auto text-sm text-blue-400 hover:text-blue-300">
            Admin Settings
          </Link>
        )}
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
