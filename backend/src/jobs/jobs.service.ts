import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { InteractionsService } from '../interactions/interactions.service';
import { TargetsService } from '../targets/targets.service';
import { LeadAnalysisService } from '../leads/lead-analysis.service';
import { LeadExtractionService } from '../leads/lead-extraction.service';
import { TikTokInboxSyncService } from '../social-accounts/providers/tiktok-inbox-sync.service';
import { TikTokReconnectionService } from '../social-accounts/providers/tiktok-reconnection.service';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private interactionsService: InteractionsService,
    private targetsService: TargetsService,
    private leadAnalysisService: LeadAnalysisService,
    private leadExtractionService: LeadExtractionService,
    private inboxSyncService: TikTokInboxSyncService,
    private reconnectionService: TikTokReconnectionService,
  ) {}

  // Collecter les interactions toutes les 15 minutes
  @Cron('0 */15 * * * *')
  async collectInteractions() {
    console.log('🔄 Collecting interactions...');

    const accounts = await this.prisma.socialAccount.findMany({
      where: { isActive: true },
    });

    for (const account of accounts) {
      try {
        if (account.platform === 'instagram') {
          await this.interactionsService.collectInstagramInteractions(
            account.id,
          );
        }
      } catch (error) {
        console.error(
          `Error collecting interactions for account ${account.id}:`,
          error,
        );
      }
    }
  }

  // Mettre à jour les scores d'intérêt toutes les heures
  @Cron('0 0 * * * *')
  async updateTargetScores() {
    console.log('📊 Updating target scores...');

    const workspaces = await this.prisma.workspace.findMany();

    for (const workspace of workspaces) {
      try {
        await this.targetsService.updateTargetsFromInteractions(workspace.id);
      } catch (error) {
        console.error(
          `Error updating targets for workspace ${workspace.id}:`,
          error,
        );
      }
    }
  }

  // Réinitialiser les quotas quotidiens à minuit
  @Cron('0 0 0 * * *')
  async resetQuotas() {
    console.log('🔄 Resetting daily quotas...');

    const now = new Date();
    const resetAt = new Date(now);
    resetAt.setHours(24, 0, 0, 0);

    await this.prisma.quota.updateMany({
      where: {
        resetAt: {
          lt: now,
        },
      },
      data: {
        current: 0,
        resetAt,
      },
    });
  }

  // Analyser les leads toutes les 30 minutes
  @Cron('0 */30 * * * *')
  async analyzePendingLeads() {
    console.log('🤖 Analyzing pending leads...');

    const workspaces = await this.prisma.workspace.findMany();

    for (const workspace of workspaces) {
      try {
        await this.leadAnalysisService.analyzePendingLeads(workspace.id);
      } catch (error) {
        console.error(
          `Error analyzing leads for workspace ${workspace.id}:`,
          error,
        );
      }
    }
  }

  // Collecter les interactions TikTok toutes les 15 minutes
  @Cron('0 */15 * * * *')
  async collectTikTokInteractions() {
    console.log('🔄 Collecting TikTok interactions...');

    const accounts = await this.prisma.socialAccount.findMany({
      where: { 
        isActive: true,
        platform: 'tiktok',
      },
    });

    for (const account of accounts) {
      try {
        await this.interactionsService.collectTikTokInteractions(account.id);
      } catch (error) {
        console.error(
          `Error collecting TikTok interactions for account ${account.id}:`,
          error,
        );
      }
    }
  }
}

