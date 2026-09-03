import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';

const TEMPLATE_NAMES = {
  'prd': 'Product Requirements Document (PRD)',
  'ard': 'Architecture Requirements Document (ARD)',
  'test-plan': 'Quality Assurance Test Plan',
  'brd': 'Business Requirements Document (BRD)'
};

const MOCK_GENERATED_DRAFTS = {
  'prd': `## Product Overview
This document outlines the product requirements for the new platform iteration.

## Problem Statement
Users currently face significant friction when trying to integrate their existing datasets.

## Objectives
- Reduce onboarding time by 40%
- Support real-time collaboration
- Integrate seamlessly with 3rd-party APIs

## Functional Requirements
1. The system MUST support SSO login.
2. The system MUST allow CSV uploads up to 50MB.

## Non-Functional Requirements
- 99.9% Uptime
- Sub-200ms API response time

## User Stories
As a product manager, I want to view high-level metrics so I can report on usage.

## Acceptance Criteria
- Dashboard loads within 1s
- Data matches the analytics warehouse backend`,

  'ard': `## Architecture Overview
The system employs a containerized microservices architecture to ensure independent scalability of the core modules.

## System Components
1. **API Gateway**: Handles rate limiting and request routing.
2. **Auth Service**: Manages JWT lifecycle and OAuth providers.
3. **Processing Engine**: A worker queue utilizing Redis.

## Data Flow
Client -> API Gateway -> Load Balancer -> Core Microservice -> PostgreSQL

## Technology Stack
- Frontend: React / Vite
- Backend: Node.js / Express
- Database: PostgreSQL
- Cache: Redis

## Security Considerations
All internal communication must occur over mTLS. Data at rest is encrypted using AES-256.

## Integration Points
- Stripe (Billing)
- SendGrid (Email Notifications)`
};

const DraftingInterface = () => {
  const { projectId, templateId } = useParams();
  const [instructions, setInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  const templateName = TEMPLATE_NAMES[templateId] || 'Document';

  const handleGenerate = () => {
    if (!instructions.trim()) return;
    setIsGenerating(true);
    setIsSaved(false);
    
    // Simulate generation time
    setTimeout(() => {
      const generated = MOCK_GENERATED_DRAFTS[templateId] || `## ${templateName} Draft\n\nThis is a mocked generated document based on your instructions:\n\n> ${instructions}`;
      setDraft(generated);
      setIsGenerating(false);
    }, 1500);
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-[calc(100vh-3.5rem)] overflow-y-auto">
      <div className="h-14 border-b border-border bg-background px-6 flex items-center justify-between shrink-0">
        <Link to={`/projects/${projectId}`} className="text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-1 text-sm">
          <ArrowLeft size={16} />
          Back to Project
        </Link>
        {draft && (
          <Button size="sm" onClick={handleSave} disabled={isSaved}>
            {isSaved ? <><Check size={16} className="mr-1" /> Saved</> : 'Save Draft'}
          </Button>
        )}
      </div>

      <div className="max-w-4xl mx-auto w-full p-8 flex flex-col md:flex-row gap-8">
        {/* Left Column: Instructions */}
        <div className="w-full md:w-1/2 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Draft {templateId.toUpperCase()}</h1>
            <p className="text-gray-400 mt-1">Use the drafting agent to create a structured first draft.</p>
          </div>
          
          <div className="flex-1 flex flex-col">
            <Textarea
              label="Drafting Instructions"
              placeholder="Describe what you want to create... (e.g. Create a PRD for an AI chat feature)"
              className="flex-1 min-h-[300px]"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
            <Button 
              className="mt-4 w-full" 
              onClick={handleGenerate} 
              loading={isGenerating}
              disabled={!instructions.trim() || isGenerating}
              icon={Sparkles}
            >
              Generate Draft
            </Button>
            {isSaved && (
              <p className="text-emerald-400 text-sm text-center mt-3">Draft saved locally for this prototype.</p>
            )}
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="w-full md:w-1/2">
          <div className="h-full border border-border rounded-xl bg-surface flex flex-col overflow-hidden min-h-[500px]">
            <div className="p-3 border-b border-border/50 bg-background/50">
              <h3 className="text-sm font-medium text-gray-300">Draft Preview</h3>
            </div>
            <div className="flex-1 p-6 overflow-y-auto bg-white text-gray-900 prose prose-sm max-w-none">
              {isGenerating ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <p>Generating draft...</p>
                </div>
              ) : draft ? (
                <div className="whitespace-pre-wrap font-sans">{draft}</div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-center px-8">
                  <p>Enter instructions and click generate to see a preview of your {templateName}.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraftingInterface;
