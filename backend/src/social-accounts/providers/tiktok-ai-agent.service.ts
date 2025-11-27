import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TikTokBrowserService } from './tiktok-browser.service';
import { LeadAnalysisService } from '../../leads/lead-analysis.service';

/**
 * 🤖 FlowIA Agent - Le cœur intelligent du système
 * 
 * Ce service représente l'agent IA qui observe TikTok comme un humain.
 * 
 * FLOW COMPLET :
 * 1. L'utilisateur se connecte à TikTok (OAuth ou cookies) → Session valide stockée
 * 2. L'agent IA ouvre TikTok avec Playwright en utilisant LA SESSION de l'utilisateur
 * 3. L'agent IA "voit" TikTok comme un humain (lit le DOM, observe les pages)
 * 4. L'agent IA récupère toutes les interactions (likes, comments, follows, DM)
 * 5. L'agent IA analyse et classe les leads (artistes, beatmakers, prospects)
 * 6. L'agent IA génère des messages personnalisés
 * 7. L'utilisateur valide les actions proposées
 * 8. L'agent IA envoie les DM via le navigateur (comme un humain, pas d'API)
 * 
 * ⚠️ IMPORTANT : L'agent IA n'utilise PAS d'API TikTok.
 * Il navigue dans TikTok comme un humain via Playwright.
 */
@Injectable()
export class TikTokAIAgentService {
  private readonly logger = new Logger(TikTokAIAgentService.name);

  constructor(
    private prisma: PrismaService,
    private tiktokBrowserService: TikTokBrowserService,
    private leadAnalysisService: LeadAnalysisService,
  ) {}

  /**
   * 🧠 Observation TikTok par l'agent IA
   * 
   * L'agent ouvre TikTok avec la session de l'utilisateur et "voit" tout :
   * - Qui a liké
   * - Qui a commenté
   * - Qui a follow
   * - Les DM reçus
   * - Les profils intéressants
   * - Les stats
   * 
   * Tout est fait via Playwright, pas d'API.
   */
  async observeTikTok(
    accountId: string,
    cookies: string[],
  ): Promise<{
    interactions: {
      likes: any[];
      comments: any[];
      follows: any[];
      shares: any[];
      mentions: any[];
    };
    profiles: any[];
    messages: any[];
    stats: any;
  }> {
    this.logger.log(`🤖 [FlowIA Agent] Observing TikTok for account: ${accountId}`);
    this.logger.log(`👁️ [FlowIA Agent] Opening TikTok with user session via Playwright...`);

    // 📊 L'agent IA récupère d'abord les stats du compte
    this.logger.log(`\n📊 [FlowIA Agent] Récupération des statistiques du compte...`);
    const stats = await this.tiktokBrowserService.getAccountStats(cookies);

    // L'agent IA ouvre TikTok avec la session de l'utilisateur
    // Il "voit" TikTok comme un humain, pas via API
    const interactions = await this.tiktokBrowserService.getAllInteractions(cookies);

    // L'agent IA peut aussi observer d'autres choses :
    // - Profils des utilisateurs qui ont interagi
    // - Messages reçus
    // - Stats, etc.

    this.logger.log(`✅ [FlowIA Agent] Observation complete:`, {
      likes: interactions.likes.length,
      comments: interactions.comments.length,
      follows: interactions.follows.length,
      shares: interactions.shares.length,
      mentions: interactions.mentions.length,
    });

    return {
      interactions,
      profiles: [], // TODO: Extraire les profils des utilisateurs
      messages: [], // TODO: Récupérer les DM
      stats, // 📊 Stats du compte
    };
  }

  /**
   * 🎯 Analyse intelligente des interactions par l'agent IA
   * 
   * L'agent IA analyse ce qu'il a "vu" et identifie :
   * - Prospects chauds
   * - Artistes sérieux
   * - Beatmakers
   * - Leads intéressants
   * - Comportements suspects
   * - Signaux forts
   */
  async analyzeInteractions(
    workspaceId: string,
    interactions: any,
  ): Promise<{
    leads: any[];
    insights: string[];
  }> {
    this.logger.log(`\n${'='.repeat(80)}`);
    this.logger.log(`🧠 [FlowIA Agent] Démarrage de l'analyse IA des interactions`);
    this.logger.log(`${'='.repeat(80)}`);
    this.logger.log(`📊 [FlowIA Agent] Interactions observées :`);
    this.logger.log(`   - Likes: ${interactions.likes?.length || 0}`);
    this.logger.log(`   - Commentaires: ${interactions.comments?.length || 0}`);
    this.logger.log(`   - Follows: ${interactions.follows?.length || 0}`);
    this.logger.log(`   - Partages: ${interactions.shares?.length || 0}`);
    this.logger.log(`   - Mentions: ${interactions.mentions?.length || 0}`);
    this.logger.log(`\n💭 [FlowIA Agent] L'IA va maintenant analyser chaque lead...\n`);

    // L'agent IA analyse les interactions et génère des leads
    await this.leadAnalysisService.analyzePendingLeads(workspaceId);

    // Récupérer les leads générés
    const leads = await this.prisma.lead.findMany({
      where: {
        workspaceId,
        status: 'new',
      },
      include: {
        target: {
          include: {
            interactions: {
              take: 10,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        suggestedMessages: {
          where: {
            status: 'pending',
          },
        },
      },
      orderBy: {
        interestScore: 'desc',
      },
      take: 50,
    });

    // Générer des insights
    const insights = this.generateInsights(leads, interactions);

    this.logger.log(`✅ [FlowIA Agent] Analysis complete: ${leads.length} leads identified`);

    return {
      leads,
      insights,
    };
  }

  /**
   * 💬 Génération de messages par l'agent IA
   * 
   * L'agent IA génère des messages personnalisés pour chaque lead
   * basés sur ce qu'il a "vu" dans TikTok.
   */
  async generateMessages(workspaceId: string): Promise<{
    messages: any[];
    total: number;
  }> {
    this.logger.log(`💬 [FlowIA Agent] Generating messages for workspace: ${workspaceId}`);

    // L'analyse IA génère déjà les messages via LeadAnalysisService
    // On récupère juste les messages suggérés
    const messages = await this.prisma.suggestedMessage.findMany({
      where: {
        workspaceId,
        status: 'pending',
      },
      include: {
        lead: {
          include: {
            target: {
              include: {
                interactions: {
                  take: 5,
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
          },
        },
      },
      orderBy: {
        generatedAt: 'desc',
      },
    });

    this.logger.log(`✅ [FlowIA Agent] ${messages.length} messages ready for validation`);

    return {
      messages,
      total: messages.length,
    };
  }

  /**
   * 📤 Envoi de DM par l'agent IA via le navigateur
   * 
   * L'agent IA envoie les DM comme un humain :
   * - Ouvre le profil TikTok
   * - Clique sur "Message"
   * - Tape le message
   * - Clique sur "Send"
   * 
   * Pas d'API, tout via Playwright.
   */
  async sendDmViaBrowser(
    accountId: string,
    username: string,
    message: string,
    cookies: string[],
    workspaceId: string,
  ): Promise<{ success: boolean; error?: string }> {
    this.logger.log(`📤 [FlowIA Agent] Sending DM to @${username} via browser (like a human)`);
    this.logger.log(`🤖 [FlowIA Agent] Opening TikTok → Profile → Message → Type → Send`);

    // L'agent IA utilise le navigateur pour envoyer le DM
    // Exactement comme un humain le ferait
    return await this.tiktokBrowserService.sendDm(username, message, cookies, workspaceId);
  }

  /**
   * 🔄 Cycle complet de l'agent IA
   * 
   * 1. Observer TikTok (ouvre avec Playwright, lit le DOM)
   * 2. Sauvegarder les interactions en base
   * 3. Créer/Mettre à jour les Targets et Leads
   * 4. Analyser les interactions (IA)
   * 5. Générer des messages personnalisés
   */
  async runFullCycle(
    accountId: string,
    cookies: string[],
    workspaceId: string,
  ): Promise<{
    observed: boolean;
    saved: boolean;
    analyzed: boolean;
    messagesGenerated: number;
  }> {
    this.logger.log(`🔄 [FlowIA Agent] Starting full cycle for account: ${accountId}`);

    try {
      // 1. Observer TikTok (l'agent IA ouvre TikTok avec la session utilisateur)
      const observation = await this.observeTikTok(accountId, cookies);

      // 📊 Afficher les stats du compte
      if (observation.stats) {
        this.logger.log(`\n${'='.repeat(80)}`);
        this.logger.log(`📊 [FlowIA Agent] VUE D'ENSEMBLE DU COMPTE`);
        this.logger.log(`${'='.repeat(80)}`);
        if (observation.stats.username) {
          this.logger.log(`   👤 Compte: @${observation.stats.username}`);
        }
        if (observation.stats.followers !== null) {
          this.logger.log(`   👥 Abonnés: ${observation.stats.followers.toLocaleString()}`);
        }
        if (observation.stats.following !== null) {
          this.logger.log(`   ➕ Abonnements: ${observation.stats.following.toLocaleString()}`);
        }
        if (observation.stats.likes !== null) {
          this.logger.log(`   ❤️ Likes totaux: ${observation.stats.likes.toLocaleString()}`);
        }
        if (observation.stats.videos !== null) {
          this.logger.log(`   🎬 Vidéos: ${observation.stats.videos.toLocaleString()}`);
        }
        this.logger.log(`${'='.repeat(80)}\n`);
      }

      // 2. Sauvegarder les interactions en base
      await this.saveInteractionsToDatabase(accountId, workspaceId, observation.interactions);

      // 3. Créer/Mettre à jour les Targets et Leads depuis les interactions
      await this.processInteractionsToLeads(accountId, workspaceId, observation.interactions);

      // 4. Analyser les interactions avec l'IA (classification + scoring + messages)
      const analysis = await this.analyzeInteractions(workspaceId, observation.interactions);

      // 5. Générer des messages personnalisés
      const messages = await this.generateMessages(workspaceId);

      this.logger.log(`✅ [FlowIA Agent] Full cycle complete:`, {
        interactions: Object.values(observation.interactions).flat().length,
        leads: analysis.leads.length,
        messages: messages.total,
      });

      return {
        observed: true,
        saved: true,
        analyzed: true,
        messagesGenerated: messages.total,
      };
    } catch (error) {
      this.logger.error(`❌ [FlowIA Agent] Error in full cycle:`, error);
      throw error;
    }
  }

  /**
   * Sauvegarde les interactions observées en base de données
   */
  private async saveInteractionsToDatabase(
    accountId: string,
    workspaceId: string,
    interactions: any,
  ): Promise<void> {
    const allInteractions = [
      ...(interactions.likes || []).map((i: any) => ({
        ...i,
        type: 'like',
      })),
      ...(interactions.comments || []).map((i: any) => ({
        ...i,
        type: 'comment',
      })),
      ...(interactions.follows || []).map((i: any) => ({
        ...i,
        type: 'follow',
      })),
      ...(interactions.shares || []).map((i: any) => ({
        ...i,
        type: 'share',
      })),
      ...(interactions.mentions || []).map((i: any) => ({
        ...i,
        type: 'mention',
      })),
    ];

    this.logger.log(`📊 [FlowIA Agent] Found ${allInteractions.length} total interactions to process`);
    
    let savedCount = 0;
    let duplicateCount = 0;
    let skippedCount = 0;

    for (const interaction of allInteractions) {
      if (!interaction.username) {
        skippedCount++;
        continue;
      }

      try {
        // Vérifier si l'interaction existe déjà
        const existing = await this.prisma.interactionEvent.findFirst({
          where: {
            workspaceId,
            platform: 'tiktok',
            type: interaction.type,
            actorId: interaction.username,
            contentRef: interaction.videoId || interaction.contentRef || null,
          },
        });

        if (!existing) {
          await this.prisma.interactionEvent.create({
            data: {
              workspaceId,
              socialAccountId: accountId,
              platform: 'tiktok',
              type: interaction.type,
              actorId: interaction.username,
              actorUsername: interaction.username,
              contentRef: interaction.videoId || interaction.contentRef || null,
              contentUrl: interaction.videoUrl || null,
              message: interaction.comment || interaction.text || null,
              rawData: interaction,
              processed: false, // Marquer comme non traité pour l'analyse IA
            },
          });
          savedCount++;
        } else {
          duplicateCount++;
        }
      } catch (error) {
        this.logger.error(`Error saving interaction for @${interaction.username}:`, error);
      }
    }

    this.logger.log(`💾 [FlowIA Agent] Saved ${savedCount} new interactions, ${duplicateCount} duplicates skipped, ${skippedCount} skipped (no username)`);
  }

  /**
   * Transforme les interactions en Targets et Leads
   */
  private async processInteractionsToLeads(
    accountId: string,
    workspaceId: string,
    interactions: any,
  ): Promise<void> {
    const allUsers = new Set<string>();

    // Collecter tous les utilisateurs uniques qui ont interagi
    [
      ...(interactions.comments || []),
      ...(interactions.likes || []),
      ...(interactions.follows || []),
      ...(interactions.mentions || []),
    ].forEach((i: any) => {
      if (i.username) allUsers.add(i.username);
    });

    for (const username of allUsers) {
      try {
        // Déterminer le type d'interaction dominant
        let type = 'like';
        if (interactions.comments?.find((c: any) => c.username === username)) type = 'comment';
        else if (interactions.mentions?.find((m: any) => m.username === username)) type = 'mention';
        else if (interactions.follows?.find((f: any) => f.username === username)) type = 'follow';

        // Créer/Mettre à jour la Target
        const target = await this.prisma.target.upsert({
          where: {
            workspaceId_platform_platformUserId: {
              workspaceId,
              platform: 'tiktok',
              platformUserId: username,
            },
          },
          update: {
            lastInteractionAt: new Date(),
            interestScore: { increment: this.getScoreIncrement(type) },
          },
          create: {
            workspaceId,
            socialAccountId: accountId,
            platform: 'tiktok',
            platformUserId: username,
            username: username,
            interestScore: this.getScoreIncrement(type),
            lastInteractionAt: new Date(),
            isTargetable: true,
          },
        });

        // Créer/Mettre à jour le Lead
        await this.prisma.lead.upsert({
          where: { targetId: target.id },
          update: {
            lastInteractionAt: new Date(),
            status: 'in_progress',
            interestScore: target.interestScore,
          },
          create: {
            workspaceId,
            targetId: target.id,
            platform: 'tiktok',
            username: username,
            platformUserId: username,
            source: 'auto_detection',
            status: 'new',
            interestScore: target.interestScore,
            lastInteractionAt: new Date(),
          },
        });
      } catch (error) {
        this.logger.error(`Error processing lead @${username}:`, error);
      }
    }

    this.logger.log(`🎯 [FlowIA Agent] Processed ${allUsers.size} users into leads`);
  }

  private getScoreIncrement(type: string): number {
    switch (type) {
      case 'comment': return 5;
      case 'share': return 10;
      case 'mention': return 8;
      case 'like': return 1;
      case 'follow': return 3;
      default: return 1;
    }
  }

  /**
   * Génère des insights basés sur l'analyse
   */
  private generateInsights(leads: any[], interactions: any): string[] {
    const insights: string[] = [];

    const hotLeads = leads.filter((l) => (l.interestScore || 0) > 70);
    if (hotLeads.length > 0) {
      insights.push(`🔥 ${hotLeads.length} leads chauds identifiés (score > 70)`);
    }

    const artists = leads.filter((l) => l.leadType === 'artist');
    if (artists.length > 0) {
      insights.push(`🎵 ${artists.length} artistes détectés`);
    }

    const beatmakers = leads.filter((l) => l.leadType === 'beatmaker');
    if (beatmakers.length > 0) {
      insights.push(`🎹 ${beatmakers.length} beatmakers détectés`);
    }

    const comments = interactions.comments?.length || 0;
    if (comments > 0) {
      insights.push(`💬 ${comments} commentaires analysés`);
    }

    return insights;
  }
}

