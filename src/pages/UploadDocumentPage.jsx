import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, UploadCloud } from 'lucide-react';
import { useDocuments } from '../context/DocumentContext';
import { STAGES } from '../constants/stages';
import { mockUser } from '../data/mockUser';
import Input from '../components/ui/Input';
import Dropdown from '../components/ui/Dropdown';
import Button from '../components/ui/Button';
import Textarea from '../components/ui/Textarea';

const UploadDocumentPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { addDocument } = useDocuments();

  const [documentName, setDocumentName] = useState('');
  const [stage, setStage] = useState('');
  const [file, setFile] = useState(null);
  
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [teamVisibility, setTeamVisibility] = useState('Engineering');
  const [sensitivity, setSensitivity] = useState('Public');

  const [errors, setErrors] = useState({});

  const stageOptions = STAGES.map(s => ({ label: s, value: s }));
  const teamOptions = ['Engineering', 'Design', 'Product', 'QA'].map(t => ({ label: t, value: t }));
  const sensitivityOptions = ['Public', 'Internal', 'Confidential', 'Restricted'].map(s => ({ label: s, value: s }));

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) setFile(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) setFile(selectedFile);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!documentName.trim()) newErrors.documentName = "Document Name is required.";
    if (!stage) newErrors.stage = "Stage is required.";
    if (!file) newErrors.file = "File is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Determine type from file name/extension for mock
    const ext = file.name.split('.').pop().toUpperCase() || 'TXT';

    const newDoc = {
      id: `d-${Date.now()}`,
      projectId,
      name: documentName,
      type: ext,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      uploadedBy: mockUser.name,
      stage,
      description,
      tags,
      teamVisibility,
      sensitivity
    };

    addDocument(newDoc);
    navigate(`/projects/${projectId}`);
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-[calc(100vh-3.5rem)] overflow-y-auto">
      <div className="h-14 border-b border-border bg-background px-6 flex items-center shrink-0">
        <Link to={`/projects/${projectId}`} className="text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-1 text-sm">
          <ArrowLeft size={16} />
          Back to Project
        </Link>
      </div>

      <div className="max-w-3xl mx-auto w-full p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-100">Upload Document</h1>
          <p className="text-gray-400 mt-1">Add a new document to this project's sources.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* File Upload Area */}
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className={`w-full border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-colors
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
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
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-200 border-b border-border pb-2">Optional Metadata</h3>
              <Dropdown 
                label="Team Visibility" 
                options={teamOptions}
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
            </div>
          </div>
          
          <div className="space-y-6">
            <Textarea 
              label="Description (Optional)" 
              placeholder="Provide context about this document..." 
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            
            <div className="bg-surface p-4 rounded-lg border border-border flex gap-8">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">Uploaded By</p>
                <p className="text-sm text-gray-200">{mockUser.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">Upload Date</p>
                <p className="text-sm text-gray-200">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-border">
            <Button variant="ghost" type="button" onClick={() => navigate(`/projects/${projectId}`)}>Cancel</Button>
            <Button type="submit">Upload Document</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadDocumentPage;
