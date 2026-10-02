import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type GeneratedPostDraft = {
  title: string;
  content: string;
};

type GeminiDraftJson = {
  title?: unknown;
  content?: unknown;
};

/** Generates blog post drafts via the Gemini API. */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: GoogleGenerativeAI;
  private readonly modelName: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('GEMINI_API_KEY');
    this.modelName =
      this.configService.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generatePostDraft(topic: string): Promise<GeneratedPostDraft> {
    const model = this.client.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = [
      'You are a blog writing assistant.',
      'Write a blog post draft for the given topic.',
      'Respond with a JSON object only, using this shape:',
      '{"title":"string","content":"string"}',
      'Rules:',
      '- title must be concise and at most 255 characters',
      '- content must be plain text suitable for a blog body (a few paragraphs)',
      '- do not include markdown fences or any text outside the JSON object',
      '',
      `Topic: ${topic}`,
    ].join('\n');

    let rawText: string;
    try {
      const result = await model.generateContent(prompt);
      rawText = result.response.text();
    } catch (error) {
      this.logger.error(
        `Gemini generateContent failed for model ${this.modelName}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new ServiceUnavailableException(
        'Failed to generate post draft. Please try again later.',
      );
    }

    return this.parseDraft(rawText);
  }

  private parseDraft(rawText: string): GeneratedPostDraft {
    let parsed: GeminiDraftJson;
    try {
      parsed = JSON.parse(rawText) as GeminiDraftJson;
    } catch {
      throw new BadRequestException('AI returned an invalid draft format');
    }

    const title =
      typeof parsed.title === 'string' ? parsed.title.trim() : '';
    const content =
      typeof parsed.content === 'string' ? parsed.content.trim() : '';

    if (!title || !content) {
      throw new BadRequestException('AI returned an incomplete draft');
    }

    return {
      title: title.slice(0, 255),
      content,
    };
  }
}
