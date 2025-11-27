// backend/src/leads/lead-extraction.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ExtractedLead {
  phone?: string;
  email?: string;
  name?: string;
  intent?: string; // "interested", "asking_price", "ready_to_buy", etc.
  confidence: number; // 0-100
}

@Injectable()
export class LeadExtractionService {
  private readonly logger = new Logger(LeadExtractionService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Extrait les informations de lead (téléphone, email) depuis un texte
   */
  extractLeadInfo(text: string): ExtractedLead {
    const result: ExtractedLead = {
      confidence: 0,
    };

    // Extraction téléphone (formats FR et internationaux)
    const phonePatterns = [
      /(\+33|0)[1-9](\d{2}){4}\d{2}/g, // Format français
      /(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, // Format international
      /\d{10}/g, // 10 chiffres consécutifs
    ];

    for (const pattern of phonePatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        // Nettoyer le numéro
        let phone = matches[0].replace(/[\s.-]/g, '');
        if (phone.startsWith('+33')) {
          phone = phone.replace('+33', '0');
        }
        if (phone.length >= 10) {
          result.phone = phone;
          result.confidence += 40;
          break;
        }
      }
    }

    // Extraction email
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emailMatches = text.match(emailPattern);
    if (emailMatches && emailMatches.length > 0) {
      result.email = emailMatches[0].toLowerCase();
      result.confidence += 40;
    }

    // Détection d'intention
    const lowerText = text.toLowerCase();
    if (
      lowerText.includes('prix') ||
      lowerText.includes('tarif') ||
      lowerText.includes('combien') ||
      lowerText.includes('price')
    ) {
      result.intent = 'asking_price';
      result.confidence += 20;
    } else if (
      lowerText.includes('intéressé') ||
      lowerText.includes('intéressée') ||
      lowerText.includes('interested')
    ) {
      result.intent = 'interested';
      result.confidence += 20;
    } else if (
      lowerText.includes('acheter') ||
      lowerText.includes('commander') ||
      lowerText.includes('buy') ||
      lowerText.includes('order')
    ) {
      result.intent = 'ready_to_buy';
      result.confidence += 20;
    }

    // Limiter la confiance à 100
    result.confidence = Math.min(result.confidence, 100);

    return result;
  }

  /**
   * Extrait les leads depuis une conversation DM
   */
  async extractLeadsFromConversation(
    conversationId: string,
    workspaceId: string,
  ): Promise<ExtractedLead[]> {
    this.logger.log(
      `🔍 [LEAD EXTRACTION] Extraction des leads depuis conversation: ${conversationId}`,
    );

    // Récupérer tous les messages de la conversation
    // Note: Il faudra adapter selon votre schéma Prisma
    const messages = await this.prisma.interactionEvent.findMany({
      where: {
        type: 'dm',
        // conversationId ou autre identifiant
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 50, // Limiter aux 50 derniers messages
    });

    const extractedLeads: ExtractedLead[] = [];

    for (const message of messages) {
      if (message.message) {
        const leadInfo = this.extractLeadInfo(message.message);
        if (leadInfo.phone || leadInfo.email || leadInfo.intent) {
          extractedLeads.push(leadInfo);
        }
      }
    }

    this.logger.log(
      `✅ [LEAD EXTRACTION] ${extractedLeads.length} leads extraits depuis la conversation`,
    );

    return extractedLeads;
  }

  /**
   * Met à jour un Lead avec les informations extraites
   */
  async updateLeadWithExtractedInfo(
    leadId: string,
    extractedInfo: ExtractedLead,
  ): Promise<void> {
    const updateData: any = {};

    if (extractedInfo.phone) {
      updateData.phone = extractedInfo.phone;
    }

    if (extractedInfo.email) {
      updateData.email = extractedInfo.email;
    }

    if (extractedInfo.intent) {
      updateData.metadata = {
        intent: extractedInfo.intent,
        extractionConfidence: extractedInfo.confidence,
      };
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: updateData,
      });

      this.logger.log(
        `✅ [LEAD EXTRACTION] Lead ${leadId} mis à jour avec les informations extraites`,
      );
    }
  }

  /**
   * Analyse tous les messages DM récents pour extraire les leads
   */
  async extractLeadsFromRecentDMs(workspaceId: string): Promise<number> {
    this.logger.log(
      `🔍 [LEAD EXTRACTION] Analyse des DM récents pour workspace: ${workspaceId}`,
    );

    // Récupérer tous les DM des 7 derniers jours
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dms = await this.prisma.interactionEvent.findMany({
      where: {
        type: 'dm',
        createdAt: {
          gte: sevenDaysAgo,
        },
        socialAccount: {
          workspaceId,
        },
      },
      include: {
        target: true,
      },
    });

    let extractedCount = 0;

    for (const dm of dms) {
      if (!dm.message) continue;

      const extractedInfo = this.extractLeadInfo(dm.message);

      if (extractedInfo.phone || extractedInfo.email) {
        // Trouver ou créer le Lead associé
        let lead = await this.prisma.lead.findFirst({
          where: {
            workspaceId,
            targetId: dm.targetId,
          },
        });

        if (!lead) {
          // Créer un nouveau Lead
          // Récupérer le username depuis le target
          const target = dm.target;
          lead = await this.prisma.lead.create({
            data: {
              workspaceId,
              targetId: dm.targetId,
              platform: 'tiktok',
              username: target?.username || target?.platformUserId || 'unknown',
              source: 'dm',
              status: 'new',
            },
          });
        }

        // Mettre à jour avec les informations extraites
        await this.updateLeadWithExtractedInfo(lead.id, extractedInfo);
        extractedCount++;
      }
    }

    this.logger.log(
      `✅ [LEAD EXTRACTION] ${extractedCount} leads mis à jour avec informations extraites`,
    );

    return extractedCount;
  }
}

