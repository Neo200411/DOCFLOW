import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import ProjectsPage from '../pages/ProjectsPage';
import ProjectWorkspace from '../pages/ProjectWorkspace';
import UploadDocumentPage from '../pages/UploadDocumentPage';
import DraftingInterface from '../components/studio/DraftingInterface';
import ComponentShowcase from '../pages/ComponentShowcase';
import LoginPage from '../pages/LoginPage';

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectWorkspace />} />
        <Route path="/projects/:projectId/upload" element={<UploadDocumentPage />} />
        <Route path="/projects/:projectId/studio/:templateId" element={<DraftingInterface />} />
      </Route>
      {/* Dev routes outside layout */}
      <Route path="/dev/components" element={<ComponentShowcase />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
};

export default AppRoutes;
