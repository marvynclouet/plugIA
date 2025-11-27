// backend/src/social-accounts/providers/tiktok-inbox-sync.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { TikTokInboxService, InboxInteraction } from './tiktok-inbox.service';
import { TikTokBrowserService } from './tiktok-browser.service';
import { SocialAccountsService } from '../social-accounts.service';
import { InteractionsService } from '../../interactions/interactions.service';
import { LeadAnalysisService } from '../../leads/lead-analysis.service';

@Injectable()
export class TikTokInboxSyncService {
  private readonly logger = new Logger(TikTokInboxSyncService.name);
  private readonly runningSyncs = new Set<string>(); // Pour éviter les doublons

  constructor(
    private prisma: PrismaService,
    private inboxService: TikTokInboxService,
    private browserService: TikTokBrowserService,
    private socialAccountsService: SocialAccountsService,
    private interactionsService: InteractionsService,
    private leadAnalysisService: LeadAnalysisService,
  ) {}

  /**
   * Job récurrent : Scrape l'Inbox TikTok toutes les 3 minutes
   * 
   * Flow :
   * 1. Récupère tous les comptes TikTok actifs
   * 2. Pour chaque compte : scrape l'Inbox
   * 3. Sauvegarde les nouvelles interactions en DB
   * 4. Déclenche l'analyse IA pour les nouvelles interactions
   */
  @Cron('0 */3 * * * *') // Toutes les 3 minutes
  async syncAllTikTokInboxes() {
    this.logger.log('🔄 [INBOX SYNC] Démarrage du sync de tous les Inbox TikTok...');

    try {
      // Récupérer tous les comptes TikTok actifs
      const accounts = await this.prisma.socialAccount.findMany({
        where: {
          platform: 'tiktok',
          isActive: true,
        },
        include: {
          workspace: true,
        },
      });

      this.logger.log(`📊 [INBOX SYNC] ${accounts.length} comptes TikTok actifs trouvés`);

      // Traiter chaque compte en parallèle (avec limite)
      const syncPromises = accounts.map((account) =>
        this.syncInboxForAccount(account.id, account.workspaceId).catch((error) => {
          this.logger.error(
            `❌ [INBOX SYNC] Erreur pour account ${account.id}: ${error.message}`,
          );
        }),
      );

      await Promise.allSettled(syncPromises);

      this.logger.log('✅ [INBOX SYNC] Sync terminé pour tous les comptes');
    } catch (error) {
      this.logger.error(`❌ [INBOX SYNC] Erreur globale: ${error.message}`);
    }
  }

  /**
   * Scrape l'Inbox pour un compte spécifique
   */
  async syncInboxForAccount(accountId: string, workspaceId: string): Promise<void> {
    // Éviter les doublons
    if (this.runningSyncs.has(accountId)) {
      this.logger.warn(`⚠️ [INBOX SYNC] Sync déjà en cours pour account: ${accountId}`);
      return;
    }

    this.runningSyncs.add(accountId);

    try {
      this.logger.log(`📬 [INBOX SYNC] Sync Inbox pour account: ${accountId}`);

      // Récupérer les cookies décryptés
      const cookies = await this.socialAccountsService.getDecryptedCookies(accountId);
      if (!cookies || cookies.length === 0) {
        throw new Error('Aucun cookie disponible pour ce compte');
      }

      // Scraper l'Inbox
      const interactions = await this.inboxService.scrapeInbox(accountId, cookies);

      this.logger.log(
        `✅ [INBOX SYNC] ${interactions.length} interactions trouvées pour account: ${accountId}`,
      );

      // Sauvegarder les interactions en DB
      const savedCount = await this.saveInteractionsToDatabase(
        accountId,
        workspaceId,
        interactions,
      );

      this.logger.log(
        `💾 [INBOX SYNC] ${savedCount} nouvelles interactions sauvegardées pour account: ${accountId}`,
      );

      // Déclencher l'analyse IA pour les nouvelles interactions
      if (savedCount > 0) {
        this.logger.log(
          `🤖 [INBOX SYNC] Déclenchement analyse IA pour ${savedCount} nouvelles interactions...`,
        );
        // L'analyse IA sera faite par le job cron existant, mais on peut aussi le déclencher ici
        await this.triggerAIAnalysis(workspaceId);
      }
    } catch (error) {
      this.logger.error(
        `❌ [INBOX SYNC] Erreur lors du sync pour account ${accountId}: ${error.message}`,
      );

      // Si c'est une erreur de session expirée, marquer le compte comme expiré
      if (error.message.includes('SESSION_EXPIRED') || error.message.includes('expirée')) {
        await this.handleSessionExpired(accountId);
      }
    } finally {
      this.runningSyncs.delete(accountId);
    }
  }

  /**
   * Sauvegarde les interactions dans la base de données
   */
  private async saveInteractionsToDatabase(
    accountId: string,
    workspaceId: string,
    interactions: InboxInteraction[],
  ): Promise<number> {
    let savedCount = 0;

    for (const interaction of interactions) {
      try {
        // Vérifier si l'interaction existe déjà (éviter les doublons)
        const existing = await this.prisma.interactionEvent.findFirst({
          where: {
            socialAccountId: accountId,
            actorUsername: interaction.username,
            type: this.mapInteractionType(interaction.type),
            createdAt: {
              gte: new Date(interaction.timestamp.getTime() - 60000), // ±1 minute
              lte: new Date(interaction.timestamp.getTime() + 60000),
            },
          },
        });

        if (existing) {
          continue; // Déjà sauvegardée
        }

        // Créer ou récupérer le Target
        let target = await this.prisma.target.findFirst({
          where: {
            workspaceId,
            platformUserId: interaction.username,
            platform: 'tiktok',
          },
        });

        if (!target) {
          target = await this.prisma.target.create({
            data: {
              workspaceId,
              platformUserId: interaction.username,
              platform: 'tiktok',
              username: interaction.username,
            },
          });
        }

        // Créer l'interaction
        await this.prisma.interactionEvent.create({
          data: {
            workspaceId,
            socialAccountId: accountId,
            platform: 'tiktok',
            type: this.mapInteractionType(interaction.type),
            actorId: interaction.username,
            actorUsername: interaction.username,
            targetId: target.id,
            message: interaction.content || null,
            contentUrl: interaction.videoUrl || null,
            rawData: {
              isNew: interaction.isNew,
              profileUrl: interaction.profileUrl,
            } as any,
            processed: false, // À analyser par l'IA
          },
        });

        savedCount++;
      } catch (error) {
        this.logger.warn(
          `⚠️ [INBOX SYNC] Erreur lors de la sauvegarde d'une interaction: ${error.message}`,
        );
        continue;
      }
    }

    return savedCount;
  }

  /**
   * Mappe le type d'interaction Inbox vers le type InteractionEvent
   */
  private mapInteractionType(
    type: InboxInteraction['type'],
  ): 'like' | 'comment' | 'follow' | 'share' | 'mention' | 'dm' {
    switch (type) {
      case 'like':
        return 'like';
      case 'comment':
        return 'comment';
      case 'follow':
        return 'follow';
      case 'share':
        return 'share';
      case 'mention':
        return 'mention';
      case 'dm':
        return 'dm';
      default:
        return 'mention';
    }
  }

  /**
   * Déclenche l'analyse IA pour les nouvelles interactions
   */
  private async triggerAIAnalysis(workspaceId: string): Promise<void> {
    try {
      // Utiliser le service d'analyse existant
      await this.leadAnalysisService.analyzePendingLeads(workspaceId);
    } catch (error) {
      this.logger.warn(
        `⚠️ [INBOX SYNC] Erreur lors de l'analyse IA: ${error.message}`,
      );
    }
  }

  /**
   * Gère une session expirée : marque le compte comme expiré
   */
  private async handleSessionExpired(accountId: string): Promise<void> {
    this.logger.warn(`⚠️ [INBOX SYNC] Session expirée pour account: ${accountId}`);

    await this.prisma.socialAccount.update({
      where: { id: accountId },
      data: {
        isActive: false,
      },
    });

    // TODO: Envoyer une notification à l'utilisateur pour qu'il reconnecte
    // TODO: Déclencher automatiquement une reconnexion QR code
  }
}

