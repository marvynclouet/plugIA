import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

export interface ExtractedInteraction {
  username: string;
  displayName?: string;
  type: 'like' | 'comment' | 'follow' | 'share' | 'mention';
  timestamp: string;
  content?: string;
}

@Injectable()
export class VisionService {
  private readonly logger = new Logger(VisionService.name);
  private anthropic: Anthropic | null = null;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey && apiKey !== 'sk-ant-api03-xxxxx' && apiKey.length > 20) {
      this.anthropic = new Anthropic({
        apiKey,
      });
      this.logger.log('✅ Anthropic Claude initialized for Vision AI');
    } else {
      this.logger.warn(
        '⚠️ ANTHROPIC_API_KEY not set or invalid, Vision AI will not work',
      );
      this.logger.warn(
        '⚠️ To enable Vision AI, set ANTHROPIC_API_KEY in .env file',
      );
    }
  }

  async analyzeScreenshot(
    screenshot: string,
    platform: string,
  ): Promise<ExtractedInteraction[]> {
    if (!this.anthropic) {
      this.logger.error('Anthropic client not initialized');
      return [];
    }

    const base64Data = screenshot.includes(',')
      ? screenshot.split(',')[1]
      : screenshot;

    this.logger.log(`🔍 Analyzing ${platform} screenshot with Claude Vision...`);

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: base64Data,
                },
              },
              {
                type: 'text',
                text: `Analyse cette page ${platform.toUpperCase()} Notifications.

Extrais TOUTES les interactions visibles (likes, commentaires, follows, shares, mentions).

Retourne UNIQUEMENT un JSON array valide:
[
  {
    "username": "sophie_23",
    "displayName": "Sophie",
    "type": "like" | "comment" | "follow" | "share" | "mention",
    "timestamp": "2min ago" | "1h ago" | "yesterday",
    "content": "texte si commentaire (optionnel)"
  }
]

Si aucune interaction visible: []

IMPORTANT: Retourne uniquement le JSON, sans texte avant ou après.`,
              },
            ],
          },
        ],
      });

      const responseText = message.content
        .filter((b) => b.type === 'text')
        .map((b: any) => b.text)
        .join('');

      // Extraire le JSON de la réponse
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        this.logger.warn('⚠️ No JSON array found in Claude response');
        return [];
      }

      const interactions = JSON.parse(jsonMatch[0]);
      this.logger.log(
        `✅ Extracted ${interactions.length} interactions from screenshot`,
      );
      return interactions;
    } catch (error) {
      this.logger.error(`❌ Error analyzing screenshot: ${error.message}`);
      return [];
    }
  }
}

