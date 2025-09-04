import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import axios from 'axios';
import { AIProviderEnum, AIModelEnum, AI_CONSTANTS, HTTP_MESSAGES, HTTP_MESSAGES_EXTENDED, ChannelEnum } from '../../utils';

export interface AIPromptRequest {
  readonly channels: ChannelEnum[];
  readonly productName: string;
  readonly keyBenefits: string[];
  readonly targetAudience: string;
  readonly tone: string;
  readonly model?: AIModelEnum;
  readonly userBrandContext?: string;
  readonly previousContent?: string[];
}

export interface AIResponse {
  readonly generatedContent: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface StructuredAIResponse {
  readonly _id: string;
  readonly requestId: string;
  readonly model: string;
  readonly contentType: string;
  readonly content: {
    readonly channel: string;
    readonly language: string;
    readonly tone: string;
    readonly title: string;
    readonly body: string;
    readonly cta: string;
    readonly meta: {
      readonly hashtags: string[];
      readonly emojis: string[];
    };
  };
  readonly status: string;
  readonly createdAt: Date;
}



@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly openaiClient: OpenAI;
  private readonly geminiApiKey: string;
  private readonly geminiBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    // Initialize OpenAI client
    const openaiApiKey = this.configService.get<string>('ai.openaiApiKey');
    const baseURL = this.configService.get<string>('ai.openaiBaseUrl');
    
    this.openaiClient = new OpenAI({
      apiKey: openaiApiKey,
      baseURL: baseURL || AI_CONSTANTS.OPENAI.DEFAULT_BASE_URL,
      timeout: AI_CONSTANTS.OPENAI.TIMEOUT_MS,
    });

    // Initialize Gemini API configuration
    this.geminiApiKey = this.configService.get<string>('ai.geminiApiKey');
    this.geminiBaseUrl = AI_CONSTANTS.GEMINI.BASE_URL;
  }

  async generateContent(request: AIPromptRequest): Promise<AIResponse> {
    try {
      const model = request.model || AIModelEnum.GPT_4O;
      const provider = this.getProviderFromModel(model);
      this.logger.log(`Generating content with ${provider} model: ${model}`);

      if (provider === AIProviderEnum.OPENAI) {
        return await this.generateWithOpenAI(request);
      } else if (provider === AIProviderEnum.GEMINI) {
        return await this.generateWithGemini(request);
      } else {
        throw new Error(`Unsupported AI provider: ${provider}`);
      }
    } catch (error) {
      this.logger.error('Failed to generate content:', error);
      throw new Error(`${HTTP_MESSAGES_EXTENDED.AI_GENERATION_FAILED}: ${error.message}`);
    }
  }



  async generateMultiChannelStructuredContent(request: AIPromptRequest, requestId: string): Promise<StructuredAIResponse[]> {
    try {
      const provider = this.getProviderFromModel(request.model);
      this.logger.log(`Generating multi-channel structured content with ${provider} model: ${request.model}`);

      const results: StructuredAIResponse[] = [];

      // Generate content for each channel
      for (const channel of request.channels) {
        this.logger.log(`Generating content for channel: ${channel}`);
        
        // Create channel-specific request
        const channelRequest: AIPromptRequest = {
          ...request,
          channels: [channel] // Single channel for this iteration
        };

        let generatedContent: string;

        if (provider === AIProviderEnum.OPENAI) {
          const response = await this.generateWithOpenAI(channelRequest, channel);
          generatedContent = response.generatedContent;
        } else if (provider === AIProviderEnum.GEMINI) {
          const response = await this.generateWithGemini(channelRequest, channel);
          generatedContent = response.generatedContent;
        } else {
          throw new Error(`Unsupported AI provider: ${provider}`);
        }

        // Parse the JSON response
        try {
          const jsonContent = this.extractJsonFromResponse(generatedContent);
          const parsedResponse = JSON.parse(jsonContent);
          

          
          // Validate and structure the response
          const structuredResponse: StructuredAIResponse = {
            _id: parsedResponse._id || this.generateId(),
            requestId: requestId,
            model: parsedResponse.model || request.model,
            contentType: parsedResponse.contentType || 'ad_copy',
            content: {
              channel: channel,
              language: parsedResponse.content?.language || 'en',
              tone: parsedResponse.content?.tone || request.tone,
              title: parsedResponse.content?.title || '',
              body: parsedResponse.content?.body || '',
              cta: parsedResponse.content?.cta || '',
              meta: {
                hashtags: parsedResponse.content?.meta?.hashtags || [],
                emojis: parsedResponse.content?.meta?.emojis || []
              }
            },
            status: parsedResponse.status || 'draft',
            createdAt: new Date(parsedResponse.createdAt) || new Date()
          };

          results.push(structuredResponse);
        } catch (parseError) {
          this.logger.error(`Failed to parse AI response for ${channel} as JSON:`, parseError);
          results.push(this.createFallbackStructuredResponse(channelRequest, requestId, generatedContent));
        }
      }

      return results;
    } catch (error) {
      this.logger.error('Failed to generate multi-channel structured content:', error);
      throw new Error(`${HTTP_MESSAGES_EXTENDED.AI_GENERATION_FAILED}: ${error.message}`);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private buildWordLimitInstructions(channel?: string): string {
    const channelLimits = this.getChannelWordLimits(channel);
    return `Word Limit Requirements:\n- Use platform-appropriate word limits: ${channelLimits}\n`;
  }

  private getChannelWordLimits(channel?: string): string {
    switch (channel?.toLowerCase()) {
      case 'instagram':
        return 'Instagram: Title 5-10 words, Body 50-100 words, CTA 2-5 words';
      case 'twitter':
        return 'Twitter: Title 3-8 words, Body 20-50 words, CTA 2-4 words';
      case 'facebook':
        return 'Facebook: Title 5-15 words, Body 80-150 words, CTA 3-6 words';
      case 'linkedin':
        return 'LinkedIn: Title 8-20 words, Body 100-200 words, CTA 4-8 words';
      case 'email':
        return 'Email: Title 8-15 words, Body 100-300 words, CTA 3-8 words';
      case 'website':
        return 'Website: Title 8-15 words, Body 100-250 words, CTA 3-8 words';
      default:
        return 'Instagram: Title 5-10 words, Body 50-100 words, CTA 2-5 words';
    }
  }

  private getChannelSpecificGuidelines(channel?: string): string {
    switch (channel?.toLowerCase()) {
      case 'instagram':
        return `Instagram-Specific Guidelines:
- Use high-quality, visually appealing language
- Include relevant hashtags (3-5 hashtags)
- Use emojis strategically to enhance engagement
- Focus on lifestyle and visual storytelling
- Keep content concise and scannable
- Use Instagram-specific features like Stories, Reels, or IGTV mentions if relevant`;
      
      case 'twitter':
        return `Twitter-Specific Guidelines:
- Keep content concise and within character limits
- Use trending hashtags when relevant (1-2 hashtags)
- Focus on timely, news-worthy content
- Use Twitter-specific language and abbreviations
- Encourage retweets and engagement
- Include mentions (@username) when appropriate`;
      
      case 'facebook':
        return `Facebook-Specific Guidelines:
- Create shareable, community-focused content
- Use Facebook-specific features like Events, Groups, or Marketplace
- Include relevant hashtags (2-4 hashtags)
- Focus on building community and relationships
- Use longer-form content when appropriate
- Encourage comments and shares`;
      
      case 'linkedin':
        return `LinkedIn-Specific Guidelines:
- Use professional, business-focused language
- Focus on industry insights and thought leadership
- Avoid excessive emojis and hashtags
- Include relevant professional hashtags (2-3 hashtags)
- Focus on B2B audience and networking
- Use data and statistics when relevant`;
      
      case 'email':
        return `Email-Specific Guidelines:
- Use clear, professional subject lines
- Focus on value proposition and benefits
- Include clear call-to-action buttons
- Avoid excessive emojis and hashtags
- Use email-specific formatting (personalization, segmentation)
- Focus on conversion and engagement metrics`;
      
      case 'website':
        return `Website-Specific Guidelines:
- Use clear, concise headlines and copy
- Focus on user experience and readability
- Include strong value propositions
- Use action-oriented language
- Optimize for conversions and lead generation
- Include trust signals and social proof`;
      
      default:
        return `General Social Media Guidelines:
- Use platform-appropriate language and tone
- Include relevant hashtags for discoverability
- Use emojis to enhance engagement
- Focus on audience-specific content
- Encourage interaction and engagement`;
    }
  }

  private extractJsonFromResponse(response: string): string {
    // Remove markdown code blocks if present
    let jsonContent = response.trim();
    
    // Remove ```json and ``` markers
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\s*/, '');
    }
    if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\s*/, '');
    }
    if (jsonContent.endsWith('```')) {
      jsonContent = jsonContent.replace(/\s*```$/, '');
    }
    
    // Remove any leading/trailing whitespace
    jsonContent = jsonContent.trim();
    
    this.logger.debug(`Extracted JSON content: ${jsonContent.substring(0, 100)}...`);
    
    return jsonContent;
  }



  private createFallbackStructuredResponse(
    request: AIPromptRequest, 
    requestId: string, 
    rawContent: string
  ): StructuredAIResponse {
    // Extract hashtags and emojis from raw content
    const hashtags = rawContent.match(/#\w+/g) || [];
    const emojis = rawContent.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || [];

    return {
      _id: this.generateId(),
      requestId: requestId,
      model: request.model,
      contentType: 'ad_copy',
      content: {
        channel: request.channels[0],
        language: 'en',
        tone: request.tone,
        title: 'Generated Content',
        body: rawContent,
        cta: 'Learn More',
        meta: {
          hashtags: hashtags,
          emojis: emojis
        }
      },
      status: 'draft',
      createdAt: new Date()
    };
  }

  private async generateWithOpenAI(request: AIPromptRequest, channel?: string): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt(request, channel);
    const userPrompt = this.buildUserPrompt(request);

    const response = await this.openaiClient.chat.completions.create({
      model: request.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      max_tokens: AI_CONSTANTS.OPENAI.MAX_TOKENS,
      temperature: AI_CONSTANTS.OPENAI.TEMPERATURE,
      top_p: AI_CONSTANTS.OPENAI.TOP_P,
      frequency_penalty: AI_CONSTANTS.OPENAI.FREQUENCY_PENALTY,
      presence_penalty: AI_CONSTANTS.OPENAI.PRESENCE_PENALTY,
    });

    const generatedContent = response.choices[0]?.message?.content;

    if (!generatedContent) {
      throw new Error('No content generated from OpenAI service');
    }

    this.logger.log('Content successfully generated with OpenAI');

    return {
      generatedContent: generatedContent.trim(),
      metadata: {
        provider: AIProviderEnum.OPENAI,
        model: request.model,
        tokens: response.usage,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private async generateWithGemini(request: AIPromptRequest, channel?: string): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt(request, channel);
    const userPrompt = this.buildUserPrompt(request);
    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;

    // Map our enum to actual Gemini model names
    const modelName = this.getGeminiModelName(request.model);

    const response = await axios.post(
      `${this.geminiBaseUrl}/${modelName}:generateContent`,
      {
        contents: [
          {
            parts: [
              {
                text: combinedPrompt,
              },
            ],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': this.geminiApiKey,
        },
        timeout: AI_CONSTANTS.GEMINI.TIMEOUT_MS,
      },
    );

    const generatedContent = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedContent) {
      throw new Error('No content generated from Gemini service');
    }

    this.logger.log('Content successfully generated with Gemini');

    return {
      generatedContent: generatedContent.trim(),
      metadata: {
        provider: AIProviderEnum.GEMINI,
        model: request.model,
        timestamp: new Date().toISOString(),
        usage: response.data?.usageMetadata,
      },
    };
  }

  private getGeminiModelName(model: AIModelEnum): string {
    switch (model) {
      case AIModelEnum.GEMINI_PRO:
        return AI_CONSTANTS.GEMINI.DEFAULT_MODEL;
      case AIModelEnum.GEMINI_PRO_VISION:
        return AI_CONSTANTS.GEMINI.DEFAULT_MODEL;
      default:
        return AI_CONSTANTS.GEMINI.DEFAULT_MODEL;
    }
  }

  private getProviderFromModel(model: AIModelEnum): AIProviderEnum {
    switch (model) {
      case AIModelEnum.GPT_4O:
      case AIModelEnum.GPT_4_TURBO:
      case AIModelEnum.GPT_4:
      case AIModelEnum.GPT_35_TURBO:
        return AIProviderEnum.OPENAI;
      case AIModelEnum.GEMINI_PRO:
      case AIModelEnum.GEMINI_PRO_VISION:
        return AIProviderEnum.GEMINI;
      default:
        return AIProviderEnum.OPENAI;
    }
  }

  private buildSystemPrompt(request: AIPromptRequest, channel?: string): string {
    const wordLimitInstructions = this.buildWordLimitInstructions(channel);
    const channelGuidelines = this.getChannelSpecificGuidelines(channel);
    const model = request.model || AIModelEnum.GPT_4O;
    
    let systemPrompt = `🎨 You are a master storyteller and content strategist with years of experience creating viral content that resonates with audiences and drives results.

🎯 YOUR MISSION: Transform product features into compelling stories that connect emotionally with your audience while maintaining authentic brand voice.

📊 CONTENT BRIEF:
• Product Focus: "${request.productName}" - the hero of our story
• Key Strengths: ${this.createBenefitsNarrative(request.keyBenefits)}
• Our Audience: ${request.targetAudience}
• Brand Voice: ${this.getToneDescription(request.tone)}
• Platform: ${channel || request.channels[0]} (optimize for this environment)`;

    // Include user's brand context if available
    if (request.userBrandContext) {
      systemPrompt += `\n\n🧬 BRAND DNA & PERSONALITY:\n${request.userBrandContext}`;
    }

    // Include previous content for context if available
    if (request.previousContent && request.previousContent.length > 0) {
      systemPrompt += `\n\n📚 BRAND VOICE REFERENCE (maintain consistency but stay fresh):\n`;
      systemPrompt += request.previousContent.slice(0, 3).map((content, index) => 
        `Example ${index + 1}:\n${content}`
      ).join('\n\n---\n\n');
      systemPrompt += `\n\n💡 IMPORTANT: Use these examples to understand the brand voice and style, but create completely NEW content. Fresh ideas, same authentic voice.`;
    }

    systemPrompt += `

IMPORTANT: You must respond ONLY with a valid JSON object in this exact format:
{
  "_id": "generated_id_here",
  "requestId": "request_id_here",
  "model": "${model}",
  "contentType": "ad_copy",
  "content": {
    "channel": "${channel || request.channels[0]}",
    "language": "en",
    "tone": "${request.tone}",
    "title": "Your catchy title here",
    "body": "Your main content body here",
    "cta": "Your call to action here",
    "meta": {
      "hashtags": ["#relevant", "#hashtags"],
      "emojis": ["🌿", "✨"]
    }
  },
  "status": "draft",
  "createdAt": "2024-01-01T00:00:00.000Z"
}

${wordLimitInstructions}

${channelGuidelines}

General Guidelines:
1. Create content that resonates with the target audience: ${request.targetAudience}
2. Use a ${request.tone} tone throughout the content
3. Highlight the product benefits: ${request.keyBenefits.join(', ')}
4. Make the content actionable and engaging
5. Generate a catchy title that includes emojis
6. Create compelling body text that drives engagement
7. Include a clear call-to-action (CTA)
8. Follow the word limits specified above

Respond ONLY with the JSON object, no additional text or explanations.`;

    return systemPrompt;
  }

  private buildUserPrompt(request: AIPromptRequest): string {
    const benefitsStory = this.createBenefitsStory(request.keyBenefits);
    const audienceStory = this.createAudienceStory(request.targetAudience);
    const channelContext = this.createChannelContext(request.channels);
    
    return `🎯 CONTENT CREATION MISSION:

Create captivating marketing content that tells the story of "${request.productName}" - a product that transforms lives through ${benefitsStory}.

📖 THE STORY WE'RE TELLING:
Imagine ${audienceStory} discovering a solution that finally delivers on its promises. This isn't just another product - it's ${request.productName}, designed specifically for people who value ${request.keyBenefits[0]?.toLowerCase()} and deserve ${request.keyBenefits.slice(1).join(' and ').toLowerCase()}.

🎨 CONTENT STYLE & VOICE:
Write in a ${request.tone} tone that feels authentic and relatable. Think of yourself as a trusted friend sharing an exciting discovery, not a pushy salesperson.

📱 PLATFORM OPTIMIZATION:
This content will live on ${channelContext}, so craft it to feel native to these platforms while maintaining our brand voice.

✨ THE MAGIC FORMULA:
1. Hook them with curiosity about ${request.productName}
2. Connect emotionally with ${request.targetAudience}'s needs
3. Showcase benefits through storytelling, not just listing
4. Include a compelling call-to-action that feels natural

Remember: Great content doesn't sell products - it tells stories that people want to be part of.

Respond ONLY with the JSON object in the exact format specified in the system prompt.`;
  }

  private createBenefitsStory(benefits: string[]): string {
    if (benefits.length === 1) return benefits[0].toLowerCase();
    if (benefits.length === 2) return `${benefits[0].toLowerCase()} and ${benefits[1].toLowerCase()}`;
    return `${benefits.slice(0, -1).map(b => b.toLowerCase()).join(', ')}, and ${benefits[benefits.length - 1].toLowerCase()}`;
  }

  private createAudienceStory(audience: string): string {
    // Extract key demographics and create a relatable persona
    const lowerAudience = audience.toLowerCase();
    
    if (lowerAudience.includes('women') && lowerAudience.includes('25-45')) {
      return "busy, successful women in their prime who juggle career and personal life";
    } else if (lowerAudience.includes('professionals')) {
      return "dedicated professionals who value quality and efficiency";
    } else if (lowerAudience.includes('young') || lowerAudience.includes('millennials')) {
      return "young, conscious consumers who research before they buy";
    } else {
      return `${audience.toLowerCase()} who are looking for authentic solutions`;
    }
  }

  private createChannelContext(channels: string[]): string {
    const channelStories = {
      'Instagram': 'visually-driven Instagram where aesthetics and authenticity matter',
      'Facebook': 'community-focused Facebook where people share and discuss',
      'LinkedIn': 'professional LinkedIn where credibility and expertise count',
      'Twitter': 'fast-paced Twitter where wit and relevance win',
      'Email': 'personal email where direct value and trust are essential',
      'Website': 'your website where visitors are actively seeking solutions'
    };

    if (channels.length === 1) {
      return channelStories[channels[0]] || channels[0];
    } else if (channels.length === 2) {
      return `${channelStories[channels[0]] || channels[0]} and ${channelStories[channels[1]] || channels[1]}`;
    } else {
      const mapped = channels.map(c => channelStories[c] || c);
      return `${mapped.slice(0, -1).join(', ')}, and ${mapped[mapped.length - 1]}`;
    }
  }

  private createBenefitsNarrative(benefits: string[]): string {
    if (benefits.length === 1) {
      return `The power of ${benefits[0].toLowerCase()}`;
    } else if (benefits.length === 2) {
      return `${benefits[0]} combined with ${benefits[1].toLowerCase()}`;
    } else {
      return `A perfect blend of ${benefits.slice(0, -1).map(b => b.toLowerCase()).join(', ')}, and ${benefits[benefits.length - 1].toLowerCase()}`;
    }
  }

  private getToneDescription(tone: string): string {
    const toneDescriptions = {
      'casual': 'Friendly, approachable, and conversational - like chatting with a knowledgeable friend',
      'formal': 'Professional, authoritative, and polished - establishing expertise and trust',
      'professional': 'Business-minded, credible, and solution-focused - speaking to industry peers',
      'playful': 'Fun, energetic, and creative - bringing joy and personality to every interaction',
      'gen-z': 'Trendy, authentic, and relatable - speaking the language of digital natives',
      'millennial': 'Aspirational, value-driven, and experience-focused - connecting with purpose-minded consumers'
    };
    
    return toneDescriptions[tone.toLowerCase()] || `${tone} and authentic`;
  }
}
