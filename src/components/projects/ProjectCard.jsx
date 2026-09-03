import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();

  return (
    <Card 
      title={project.name}
      description={project.description}
      icon={Folder}
      hoverable
      onClick={() => navigate(`/projects/${project.id}`)}
      footer={
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{project.updatedAt}</span>
          <Badge variant={project.status === 'Active' ? 'active' : 'neutral'}>
            {project.status}
          </Badge>
        </div>
      }
    />
  );
};

export default ProjectCard;
