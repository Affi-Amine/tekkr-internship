import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { ProjectPlan, Workstream, Deliverable } from '../data/chat-api';
import { ChevronDown, ChevronUp, FileText, Users, Target } from 'lucide-react';

interface ProjectPlanRendererProps {
  projectPlan: ProjectPlan;
}

export const ProjectPlanRenderer: React.FC<ProjectPlanRendererProps> = ({ projectPlan }) => {
  // Generate workstream letters (A, B, C, D, etc.)
  const getWorkstreamLetter = (index: number) => String.fromCharCode(65 + index);

  // Get appropriate icon for deliverable type
  const getDeliverableIcon = (title: string) => {
    if (title.toLowerCase().includes('charter') || title.toLowerCase().includes('document')) {
      return <FileText className="h-4 w-4" />;
    }
    if (title.toLowerCase().includes('leadership') || title.toLowerCase().includes('alignment')) {
      return <Users className="h-4 w-4" />;
    }
    if (title.toLowerCase().includes('metrics') || title.toLowerCase().includes('measurement')) {
      return <Target className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="my-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Project Workstreams</h2>
      </div>

      {/* Workstreams */}
      <div className="divide-y divide-gray-200">
        {projectPlan.workstreams.map((workstream: Workstream, workstreamIndex: number) => (
          <Accordion key={workstreamIndex} type="single" collapsible className="w-full">
            <AccordionItem value={`workstream-${workstreamIndex}`} className="border-0">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50 transition-colors">
                <div className="flex items-center w-full text-left">
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full mr-4 flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-700">
                      {getWorkstreamLetter(workstreamIndex)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {workstream.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {workstream.description}
                    </p>
                  </div>
                  <ChevronDown className="h-5 w-5 text-gray-400 ml-4 flex-shrink-0 transition-transform duration-200" />
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="px-6 pb-6">
                <div className="ml-12">
                  <div className="mb-4">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">Deliverables</h4>
                  </div>
                  
                  <div className="space-y-4">
                    {workstream.deliverables.map((deliverable: Deliverable, deliverableIndex: number) => (
                      <div key={deliverableIndex} className="flex items-start space-x-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded mt-0.5 flex-shrink-0">
                          {getDeliverableIcon(deliverable.title)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-base font-medium text-gray-900 mb-1">
                            {deliverable.title}
                          </h5>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {deliverable.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </div>
    </div>
  );
};

export default ProjectPlanRenderer;