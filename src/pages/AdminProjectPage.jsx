import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Dropdown from '../components/ui/Dropdown';
import Card from '../components/ui/Card';

const AdminProjectPage = () => {
  const { projectId } = useParams();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  
  const [accessRequests, setAccessRequests] = useState([]);
  
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('viewer');
  const [memberError, setMemberError] = useState('');

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
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const loadTeams = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/teams`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAccessRequests = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/access-requests`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAccessRequests(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadTeams();
      loadAccessRequests();
    }
  }, [isAdmin, projectId]);

  const handleApproveRequest = async (requestId) => {
    try {
      const res = await fetch(`/api/access-requests/${requestId}/approve`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        loadAccessRequests();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDenyRequest = async (requestId) => {
    try {
      const res = await fetch(`/api/access-requests/${requestId}/deny`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        loadAccessRequests();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadMembers = async (teamId) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedTeam) {
      loadMembers(selectedTeam);
    }
  }, [selectedTeam]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/projects/${projectId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newTeamName })
      });
      if (res.ok) {
        setNewTeamName('');
        loadTeams();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberError('');
    try {
      const res = await fetch(`/api/teams/${selectedTeam}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: newMemberEmail, role: newMemberRole })
      });
      if (res.ok) {
        setNewMemberEmail('');
        loadMembers(selectedTeam);
      } else {
        const errorData = await res.json();
        setMemberError(errorData.detail || 'Failed to add member');
      }
    } catch (err) {
      console.error(err);
      setMemberError('Network error');
    }
  };

  if (loading) return <div>Loading...</div>;

  if (!isAdmin) {
    return <div className="p-8 text-white">not authorized</div>;
  }

  return (
    <div className="flex-1 p-4 md:p-8 bg-background overflow-y-auto h-[calc(100vh-3.5rem)]">
      <div className="max-w-6xl mx-auto">
        <Link to={`/projects/${projectId}`} className="inline-flex items-center gap-2 mb-6 text-gray-400 hover:text-gray-200 transition-colors text-sm">
          <ArrowLeft size={16} /> Back to Project Workspace
        </Link>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text gemini-gradient">Project Admin</h1>
          <p className="text-gray-400 mt-2">Manage teams and members for this project.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-200 mb-4 border-b border-border pb-2">Teams</h2>
              <form onSubmit={handleCreateTeam} className="mb-6 flex gap-2">
                <Input 
                  value={newTeamName} 
                  onChange={e => setNewTeamName(e.target.value)} 
                  placeholder="New Team Name" 
                  required
                />
                <Button type="submit" className="shrink-0">Add Team</Button>
              </form>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {teams.map(team => (
                  <div 
                    key={team.id} 
                    className={`p-3 rounded-lg cursor-pointer transition-colors border ${selectedTeam === team.id ? 'border-primary bg-primary/10' : 'border-border bg-surface hover:border-primary/50'}`}
                    onClick={() => setSelectedTeam(team.id)}
                  >
                    <span className={selectedTeam === team.id ? 'text-primary font-medium' : 'text-gray-200'}>{team.name}</span>
                  </div>
                ))}
                {teams.length === 0 && <p className="text-gray-500 text-sm italic text-center py-4">No teams yet.</p>}
              </div>
            </Card>
          </div>
          
          <div className="md:col-span-7">
            {selectedTeam ? (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-200 mb-4 border-b border-border pb-2">Team Members</h2>
                <form onSubmit={handleAddMember} className="mb-6 space-y-4">
                  <Input 
                    value={newMemberEmail} 
                    onChange={e => setNewMemberEmail(e.target.value)} 
                    placeholder="User Email" 
                    type="email"
                    required
                  />
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Dropdown 
                        value={newMemberRole} 
                        onChange={setNewMemberRole} 
                        options={[
                          {label: 'Viewer', value: 'viewer'}, 
                          {label: 'Contributor', value: 'contributor'}, 
                          {label: 'Team Lead', value: 'team_lead'}
                        ]} 
                      />
                    </div>
                    <Button type="submit" className="shrink-0 w-full sm:w-auto">Add Member</Button>
                  </div>
                  {memberError && <p className="text-red-400 text-sm">{memberError}</p>}
                </form>
                
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {members.map(member => (
                    <div key={member.id} className="p-3 border border-border bg-background/50 rounded-lg flex justify-between items-center">
                      <span className="text-gray-200 font-medium">{member.email}</span>
                      <span className="text-xs uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">{member.role}</span>
                    </div>
                  ))}
                  {members.length === 0 && <p className="text-gray-500 text-sm italic text-center py-4">No members yet.</p>}
                </div>
              </Card>
            ) : (
              <Card className="p-12 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                <p className="text-gray-400">Select a team to view and manage its members.</p>
              </Card>
            )}
          </div>
        <div className="mt-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-200 mb-4 border-b border-border pb-2">Access Requests</h2>
            <div className="space-y-4">
              {accessRequests.length === 0 ? (
                <p className="text-gray-500 text-sm italic text-center py-4">No access requests.</p>
              ) : (
                accessRequests.map(req => {
                  const teamName = teams.find(t => t.id === req.team_id)?.name || req.team_id;
                  return (
                    <div key={req.id} className="p-4 border border-border bg-background/50 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-gray-200 font-medium">User: {req.user_id}</p>
                        <p className="text-sm text-gray-400">Team: {teamName} &bull; Status: <span className={req.status === 'pending' ? 'text-yellow-400' : req.status === 'approved' ? 'text-green-400' : 'text-red-400'}>{req.status}</span></p>
                      </div>
                      {req.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button onClick={() => handleApproveRequest(req.id)} className="bg-green-600 hover:bg-green-500">Approve</Button>
                          <Button onClick={() => handleDenyRequest(req.id)} className="bg-red-600 hover:bg-red-500">Deny</Button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
    </div>
  );
};

export default AdminProjectPage;
