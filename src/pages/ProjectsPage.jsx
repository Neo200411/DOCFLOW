import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectCard from '../components/projects/ProjectCard';
import CreateProjectCard from '../components/projects/CreateProjectCard';
import Input from '../components/ui/Input';
import { Search } from 'lucide-react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Textarea from '../components/ui/Textarea';
import Dropdown from '../components/ui/Dropdown';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // New Project Form State
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectStatus, setNewProjectStatus] = useState('Active');

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
    
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projects', { credentials: 'include' });
        if (res.status === 401) {
          navigate('/login');
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch projects');
        
        const data = await res.json();
        setProjects(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
    fetchProjects();
  }, [navigate]);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDesc,
          status: newProjectStatus
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setIsModalOpen(false);
        setNewProjectName('');
        setNewProjectDesc('');
        
        // Refetch projects
        const fetchRes = await fetch('/api/projects', { credentials: 'include' });
        if (fetchRes.ok) {
          const fetchedData = await fetchRes.json();
          setProjects(fetchedData);
        }
        
        navigate(`/projects/${data.id}`);
      } else {
        const errorData = await res.json();
        setError(errorData.detail || 'Failed to create project');
      }
    } catch (err) {
      console.error(err);
      setError('Network error');
    }
  };

  if (loading) {
    return <div className="flex-1 p-8 flex justify-center items-center text-gray-400">Loading projects...</div>;
  }

  if (error) {
    return <div className="flex-1 p-8 flex justify-center items-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Projects</h1>
          <p className="text-gray-400 mt-1">Manage and collaborate across your projects.</p>
        </div>
        <div className="w-full md:w-72">
          <Input 
            icon={Search} 
            placeholder="Search projects..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isAdmin && <CreateProjectCard onClick={() => setIsModalOpen(true)} />}
        {filteredProjects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Project"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>Create Project</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input 
            label="Project Name" 
            placeholder="e.g. Q3 Financial Report" 
            required 
            value={newProjectName}
            onChange={e => setNewProjectName(e.target.value)}
          />
          <Textarea 
            label="Description" 
            placeholder="What is this project about?" 
            value={newProjectDesc}
            onChange={e => setNewProjectDesc(e.target.value)}
          />
          <Dropdown 
            label="Status" 
            options={[{label: 'Active', value: 'Active'}, {label: 'Archived', value: 'Archived'}]} 
            value={newProjectStatus}
            onChange={setNewProjectStatus}
          />
        </div>
      </Modal>
    </div>
  );
};

export default ProjectsPage;
