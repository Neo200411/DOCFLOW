import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, UploadCloud, AlertCircle } from 'lucide-react';
import { useDocuments } from '../context/DocumentContext';
import { STAGES } from '../constants/stages';
import { mockUser } from '../data/mockUser';
import Input from '../components/ui/Input';
import Dropdown from '../components/ui/Dropdown';
import Button from '../components/ui/Button';
import Textarea from '../components/ui/Textarea';
import Card from '../components/ui/Card';

const UploadDocumentPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { addDocument, loadDocumentsForProject } = useDocuments();

  const [documentName, setDocumentName] = useState('');
  const [stage, setStage] = useState('');
  const [file, setFile] = useState(null);
  
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [teamVisibility, setTeamVisibility] = useState('');
  const [sensitivity, setSensitivity] = useState('Public');

  const [loadingTeams, setLoadingTeams] = useState(true);
  const [uploadTeams, setUploadTeams] = useState([]);
  
  const [loadingStages, setLoadingStages] = useState(true);
  const [projectStages, setProjectStages] = useState([]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const stageOptions = projectStages.map(s => ({ label: s.name, value: s.id }));
  const sensitivityOptions = ['Public', 'Internal', 'Confidential', 'Restricted'].map(s => ({ label: s, value: s }));
  
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/upload-teams`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUploadTeams(data);
          if (data.length > 0) {
            setTeamVisibility(data[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTeams(false);
      }
    };
    
    const fetchStages = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/stages`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setProjectStages(data);
          if (data.length > 0) {
            setStage(data[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingStages(false);
      }
    };
    
    fetchTeams();
    fetchStages();
  }, [projectId]);

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      if (errors.file) setErrors({...errors, file: null});
      setSubmitError(null);
      if (!documentName) setDocumentName(droppedFile.name);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (errors.file) setErrors({...errors, file: null});
      setSubmitError(null);
      if (!documentName) setDocumentName(selectedFile.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    
    // Validation
    const newErrors = {};
    if (!documentName.trim()) newErrors.documentName = "Document Name is required.";
    if (!stage) newErrors.stage = "Stage is required.";
    if (!file) newErrors.file = "File is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('project_id', projectId);
      formData.append('stage_id', stage);
      
      // Only append if the user is required to select a team or explicitly picked one
      if (teamVisibility) {
        formData.append('uploading_as_team_id', teamVisibility);
      }
      
      formData.append('sensitivity_level', sensitivity.toLowerCase());
      
      // Ensure the file retains its original extension even if the user changes the document name
      const originalExt = file.name.substring(file.name.lastIndexOf('.'));
      let finalName = documentName || file.name;
      if (!finalName.toLowerCase().endsWith(originalExt.toLowerCase())) {
        finalName += originalExt;
      }
      formData.append('file', new File([file], finalName, { type: file.type }));

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!res.ok) {
        let errMsg = "Upload failed";
        try {
          const errData = await res.json();
          errMsg = errData.detail || errMsg;
        } catch(e) {}
        throw new Error(errMsg);
      }
      
      // Success! Refresh documents and go back
      await loadDocumentsForProject(projectId);
      navigate(`/projects/${projectId}`);
      
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-[calc(100vh-3.5rem)] overflow-y-auto">
      <div className="h-14 border-b border-border bg-background px-6 flex items-center shrink-0">
        <Link to={`/projects/${projectId}`} className="text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-1 text-sm">
          <ArrowLeft size={16} />
          Back to Project
        </Link>
      </div>

      <div className="max-w-4xl mx-auto w-full p-4 md:p-8">
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text gemini-gradient">Upload Document</h1>
          <p className="text-gray-400 mt-2">Add a new document to this project's sources.</p>
        </div>

        {loadingTeams || loadingStages ? (
          <div className="text-center py-10 text-gray-500">Loading details...</div>
        ) : uploadTeams.length === 0 ? (
          <Card className="p-8 text-center flex flex-col items-center">
            <AlertCircle size={48} className="text-red-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-200 mb-2">Permission Denied</h2>
            <p className="text-gray-400 mb-6">You don't have upload permission for any team in this project.</p>
            <Button onClick={() => navigate(`/projects/${projectId}`)}>Return to Project</Button>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Area */}
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className={`w-full border-2 border-dashed rounded-xl p-8 md:p-12 flex flex-col items-center justify-center text-center transition-colors
                ${errors.file ? 'border-red-500 bg-red-500/5' : 'border-border hover:border-primary/50 hover:bg-surface-hover/50 bg-surface'}
              `}
            >
              <UploadCloud size={48} className={errors.file ? 'text-red-400' : 'text-primary mb-4'} />
              {file ? (
                <div>
                  <p className="text-gray-200 font-medium mb-1">{file.name}</p>
                  <p className="text-gray-500 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => setFile(null)}
                  >
                    Remove file
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-300 font-medium mb-1">Drag and drop your file here</p>
                  <p className="text-gray-500 text-sm mb-4">Supported files: PDF, DOCX, TXT</p>
                  <label className="cursor-pointer">
                    <span className="bg-primary text-white hover:bg-primary-dark shadow-sm inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 h-10 px-4 py-2 text-sm">
                      Browse Files
                    </span>
                    <input type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.docx,.txt" />
                  </label>
                </div>
              )}
              {errors.file && <p className="text-red-400 text-sm mt-4">{errors.file}</p>}
            </div>
            
            {submitError && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
                <p className="text-red-400 text-sm">{submitError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 space-y-6">
                <h3 className="text-lg font-medium text-gray-200 border-b border-border pb-2">Required Details</h3>
                <Input 
                  label="Document Name" 
                  placeholder="e.g. Q3 Financial Report.pdf" 
                  required 
                  value={documentName}
                  onChange={e => { setDocumentName(e.target.value); if(errors.documentName) setErrors({...errors, documentName: null})}}
                  error={errors.documentName}
                />
                <Dropdown 
                  label="Stage" 
                  placeholder="Select a stage"
                  options={stageOptions}
                  value={stage}
                  onChange={val => { setStage(val); if(errors.stage) setErrors({...errors, stage: null})}}
                  error={errors.stage}
                />
              </Card>

              <Card className="p-6 space-y-6">
                <h3 className="text-lg font-medium text-gray-200 border-b border-border pb-2">Optional Metadata</h3>
                <Dropdown 
                  label="Team Visibility" 
                  options={uploadTeams.map(t => ({ label: t.name, value: t.id }))}
                  value={teamVisibility}
                  onChange={setTeamVisibility}
                />
                <Dropdown 
                  label="Sensitivity Level" 
                  options={sensitivityOptions}
                  value={sensitivity}
                  onChange={setSensitivity}
                />
                <Input 
                  label="Tags" 
                  placeholder="e.g. analytics, frontend" 
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                />
              </Card>
            </div>
            
            <Card className="p-6 space-y-6">
              <Textarea 
                label="Description (Optional)" 
                placeholder="Provide context about this document..." 
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              
              <div className="bg-background/50 p-4 rounded-lg border border-border flex gap-8">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Uploaded By</p>
                  <p className="text-sm text-gray-200">{mockUser.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Upload Date</p>
                  <p className="text-sm text-gray-200">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </Card>

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="ghost" type="button" onClick={() => navigate(`/projects/${projectId}`)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Uploading...' : 'Upload Document'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UploadDocumentPage;
