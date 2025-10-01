import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ProjectPlanRenderer } from './ProjectPlanRenderer';
import { ProjectPlan } from '../data/chat-api';

interface MessageContentProps {
  content: string;
  projectPlan?: ProjectPlan;
  role?: 'user' | 'assistant';
}

export const MessageContent: React.FC<MessageContentProps> = ({ content, projectPlan, role = 'assistant' }) => {
  // Define prose classes based on role
  const getProseClasses = () => {
    if (role === 'user') {
      return "prose prose-invert max-w-none prose-headings:text-white prose-headings:mb-4 prose-headings:mt-8 prose-p:text-gray-100 prose-p:leading-relaxed prose-p:mb-6 prose-li:text-gray-100 prose-li:mb-2 prose-strong:text-white prose-strong:font-semibold prose-ul:space-y-3 prose-ol:space-y-3 prose-ul:mb-6 prose-ol:mb-6";
    }
    return "prose prose-gray dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-headings:mb-4 prose-headings:mt-8 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6 prose-li:text-gray-700 prose-li:mb-2 prose-strong:text-gray-900 prose-strong:font-semibold prose-ul:space-y-3 prose-ol:space-y-3 prose-ul:mb-6 prose-ol:mb-6";
  };

  const proseClasses = getProseClasses();
  // If there's a separate project plan, render it after the content
  if (projectPlan) {
    return (
      <div className="space-y-4">
        <div className={proseClasses}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        {role === 'assistant' && <ProjectPlanRenderer projectPlan={projectPlan} />}
      </div>
    );
  }

  // Check for inline project plan markers in the content
  const projectPlanRegex = /\[PROJECT_PLAN\](.*?)\[\/PROJECT_PLAN\]/g;
  const matches: RegExpExecArray[] = [];
  let match;
  while ((match = projectPlanRegex.exec(content)) !== null) {
    matches.push(match);
  }

  if (matches.length === 0) {
    // No project plan found, render as regular markdown
    return (
      <div className={proseClasses}>
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }

  // Split content around project plan markers and render mixed content
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach((match, index) => {
    const matchStart = match.index!;
    const matchEnd = matchStart + match[0].length;

    // Add text before the project plan
    if (matchStart > lastIndex) {
      const textBefore = content.slice(lastIndex, matchStart);
      if (textBefore.trim()) {
        parts.push(
          <div key={`text-before-${index}`} className={proseClasses}>
            <ReactMarkdown>{textBefore}</ReactMarkdown>
          </div>
        );
      }
    }

    // Parse and add the project plan (only for assistant messages)
    if (role === 'assistant') {
      try {
        const projectPlanJson = match[1];
        const parsedProjectPlan: ProjectPlan = JSON.parse(projectPlanJson);
        parts.push(
          <ProjectPlanRenderer 
            key={`project-plan-${index}`} 
            projectPlan={parsedProjectPlan} 
          />
        );
      } catch (error) {
        console.error('Failed to parse project plan JSON:', error);
        // Fallback: render as regular text
        parts.push(
          <div key={`fallback-${index}`} className={proseClasses}>
            <ReactMarkdown>{match[0]}</ReactMarkdown>
          </div>
        );
      }
    } else {
      // For user messages, just render as regular text
      parts.push(
        <div key={`user-text-${index}`} className={proseClasses}>
          <ReactMarkdown>{match[0]}</ReactMarkdown>
        </div>
      );
    }

    lastIndex = matchEnd;
  });

  // Add any remaining text after the last project plan
  if (lastIndex < content.length) {
    const textAfter = content.slice(lastIndex);
    if (textAfter.trim()) {
      parts.push(
        <div key="text-after" className={proseClasses}>
          <ReactMarkdown>{textAfter}</ReactMarkdown>
        </div>
      );
    }
  }

  return <div className="space-y-4">{parts}</div>;
};

export default MessageContent;