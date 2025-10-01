import { GoogleGenerativeAI } from '@google/generative-ai';
import { Message } from '../types/chat';

export interface ProjectPlan {
  workstreams: WorkStream[];
}

export interface WorkStream {
  title: string;
  description: string;
  deliverables: Deliverable[];
}

export interface Deliverable {
  title: string;
  description: string;
}

export class LLMService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 1000; // 1 second between requests

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.model = this.genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`Rate limiting: waiting ${waitTime}ms before next request`);
      await this.sleep(waitTime);
    }
    
    this.lastRequestTime = Date.now();
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.enforceRateLimit();
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${attempt + 1} failed:`, error);

        if (attempt === maxRetries) {
          break;
        }

        // Check if it's a retryable error
        const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
        const isRetryable = 
          errorMessage.includes('fetch failed') ||
          errorMessage.includes('network') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('rate limit') ||
          errorMessage.includes('quota') ||
          errorMessage.includes('503') ||
          errorMessage.includes('502') ||
          errorMessage.includes('500');

        if (!isRetryable) {
          throw error;
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.log(`Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private isProjectPlanRequest(content: string): boolean {
    const keywords = [
      'project plan', 'project planning', 'work breakdown', 'wbs',
      'workstream', 'deliverable', 'milestone', 'roadmap',
      'implementation plan', 'development plan', 'task breakdown',
      'sprint planning', 'agile planning', 'scrum planning',
      'timeline', 'schedule', 'phases', 'iterations',
      'requirements breakdown', 'feature breakdown',
      'technical roadmap', 'product roadmap',
      'architecture plan', 'design plan',
      'deployment plan', 'release plan',
      'how to build', 'how to implement', 'how to develop',
      'step by step', 'breakdown', 'organize tasks',
      'plan out', 'structure the work', 'divide the work',
      'plan to', 'create a plan', 'make a plan', 'planning',
      'mobile app plan', 'app development plan', 'build an app',
      'create an app', 'develop an app', 'app creation',
      'concise plan', 'detailed plan', 'comprehensive plan'
    ];
    
    const lowerContent = content.toLowerCase();
    
    // Check for direct keyword matches
    const hasKeyword = keywords.some(keyword => lowerContent.includes(keyword));
    
    // Check for plan-related patterns
    const planPatterns = [
      /plan\s+to\s+\w+/i,           // "plan to create", "plan to build"
      /\w+\s+plan/i,                // "mobile plan", "development plan"
      /how\s+to\s+(build|create|make|develop)/i,  // "how to build", "how to create"
      /step\s*by\s*step/i,          // "step by step", "step-by-step"
      /phase\s*\d+/i,               // "phase 1", "phase 2"
      /\d+\.\s*\w+/,                // numbered lists like "1. Planning"
    ];
    
    const hasPattern = planPatterns.some(pattern => pattern.test(content));
    
    return hasKeyword || hasPattern;
  }

  private getSystemPrompt(isProjectPlan: boolean): string {
    const basePrompt = `You are a helpful AI assistant. Provide clear, concise, and accurate responses to user questions.`;
    
    if (isProjectPlan) {
      return `${basePrompt}

CRITICAL: You have detected that this is a PROJECT PLAN request. You MUST format your response with the special project plan tags.

When the user asks for ANY type of plan, breakdown, roadmap, or step-by-step guide (including mobile app plans, development plans, implementation strategies, etc.), you MUST provide a comprehensive response in this EXACT format:

1. First, write your explanatory text, approach, and methodology OUTSIDE of any tags
2. Then, add the structured project plan data ONLY inside the special tags

MANDATORY FORMAT:
Your explanatory text about the approach and methodology goes here. This content should be visible to the user and explain your thinking, approach, and any important context.

[PROJECT_PLAN]
{
  "workstreams": [
    {
      "title": "Clear, descriptive workstream title",
      "description": "Detailed description of this workstream's purpose and scope",
      "deliverables": [
        {
          "title": "Specific deliverable name",
          "description": "Clear description of what needs to be delivered, including acceptance criteria"
        }
      ]
    }
  ]
}
[/PROJECT_PLAN]

STRICT REQUIREMENTS:
- You MUST include the [PROJECT_PLAN] tags for ANY planning request
- Include 3-6 workstreams for comprehensive coverage
- Each workstream should have 2-6 deliverables
- Make titles specific and actionable
- Include technical details in descriptions
- Consider dependencies and logical sequencing
- Ensure JSON is valid and properly formatted
- Focus on practical, implementable tasks
- NEVER put explanatory text inside the [PROJECT_PLAN] tags - only valid JSON
- The JSON must be properly escaped and formatted
- Always include both opening [PROJECT_PLAN] and closing [/PROJECT_PLAN] tags

FAILURE TO INCLUDE THE TAGS WILL RESULT IN INCORRECT RENDERING. This is a CRITICAL requirement.`;
    }
    
    return basePrompt;
  }

  private formatMessagesForGemini(messages: Message[]): any[] {
    const formattedMessages = [];
    
    for (const msg of messages) {
      formattedMessages.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }
    
    return formattedMessages;
  }

  async generateResponse(
    messages: Message[],
    userMessage: string
  ): Promise<{ content: string; projectPlan?: ProjectPlan }> {
    try {
      const isProjectPlan = this.isProjectPlanRequest(userMessage);
      console.log('Project plan detection result:', isProjectPlan, 'for message:', userMessage.substring(0, 100));
      const systemPrompt = this.getSystemPrompt(isProjectPlan);

      // Prepare conversation history
      const conversationHistory = this.formatMessagesForGemini(messages);
      
      let responseText: string;

      // If there's no history, use generateContent with system prompt
      if (conversationHistory.length === 0) {
        const prompt = `${systemPrompt}\n\nUser: ${userMessage}`;
        
        const result = await this.retryWithBackoff(async () => {
          return await this.model.generateContent(prompt);
        });
        
        responseText = result.response.text();
      } else {
        // For conversations with history, use chat
        const result = await this.retryWithBackoff(async () => {
          const chat = this.model.startChat({
            history: conversationHistory
          });
          return await chat.sendMessage(userMessage);
        });
        
        responseText = result.response.text();
      }
      
      // Debug: Log the original response
      console.log('Original LLM response length:', responseText.length);
      console.log('Original LLM response (first 500 chars):', responseText.substring(0, 500));
      console.log('Original LLM response (last 500 chars):', responseText.substring(Math.max(0, responseText.length - 500)));
      
      // Extract project plan if present
      let projectPlan: ProjectPlan | undefined;
      const projectPlanMatch = responseText.match(/\[PROJECT_PLAN\](.*?)\[\/PROJECT_PLAN\]/s);
      
      console.log('Looking for project plan tags in response...');
      console.log('Project plan match found:', !!projectPlanMatch);
      
      if (projectPlanMatch) {
        try {
          const jsonContent = projectPlanMatch[1].trim();
          console.log('Extracted JSON content:', jsonContent.substring(0, 200));
          projectPlan = JSON.parse(jsonContent);
          console.log('Successfully parsed project plan with', projectPlan?.workstreams?.length || 0, 'workstreams');
          // Remove only the project plan tags and JSON, but preserve all other content
          responseText = responseText.replace(/\[PROJECT_PLAN\].*?\[\/PROJECT_PLAN\]/s, '').trim();
          console.log('After removing project plan tags, content length:', responseText.length);
        } catch (error) {
          console.warn('Failed to parse project plan JSON:', error);
          console.log('Raw JSON that failed to parse:', projectPlanMatch[1]);
          // If JSON parsing fails, don't remove the content - just leave it as is
          console.log('Keeping original content due to JSON parse error');
        }
      } else {
        console.log('No project plan tags found in response');
        if (isProjectPlan) {
          console.warn('WARNING: Project plan was detected but LLM did not include required tags!');
        }
      }

      return {
        content: responseText,
        projectPlan
      };

    } catch (error) {
      console.error('LLM Service Error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('API_KEY') || error.message.includes('api key')) {
          throw new Error('Invalid or missing Gemini API key. Please check your configuration.');
        }
        if (error.message.includes('quota') || error.message.includes('rate limit')) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        }
        if (error.message.includes('fetch failed') || error.message.includes('network')) {
          throw new Error('Network connection failed. Please check your internet connection and try again.');
        }
      }
      
      throw new Error('Failed to generate AI response. Please try again.');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.retryWithBackoff(async () => {
        return await this.model.generateContent('Hello');
      }, 2, 500); // Fewer retries for connection test
      
      return !!result.response.text();
    } catch (error) {
      console.error('LLM connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const llmService = new LLMService();