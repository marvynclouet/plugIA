// backend/src/social-accounts/providers/tiktok-monitor.service.ts

import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InteractionsService } from '../../interactions/interactions.service';

interface TikTokMonitorRules {
  autoReplyToComments?: boolean;
  autoReplyToLikes?: boolean;
  autoReplyToFollows?: boolean;
  autoReplyToMentions?: boolean;
  minInteractionsBeforeDM?: number;
  aiEnabled?: boolean;
}

@Injectable()
export class TikTokMonitorService {
  private readonly logger = new Logger(TikTokMonitorService.name);

  private readonly jobs = new Map<string, NodeJS.Timeout>();

  constructor(
    @Inject(forwardRef(() => InteractionsService))
    private readonly interactionsService: InteractionsService,
  ) {}

  /**
   * Lance un job périodique pour un compte TikTok.
   * Ici : toutes les 60s → tu peux monter à 5min en prod.
   */
  async startMonitoring(
    accountId: string,
    cookies: any[],
    workspaceId: string,
    rules?: TikTokMonitorRules,
  ): Promise<void> {
    if (this.jobs.has(accountId)) {
      this.logger.log(
        `🔁 [MONITOR] Monitoring déjà actif pour ${accountId}, on restart.`,
      );
      this.stopMonitoring(accountId);
    }

    const effectiveRules: TikTokMonitorRules = {
      autoReplyToComments: false,
      autoReplyToLikes: false,
      autoReplyToFollows: false,
      autoReplyToMentions: false,
      minInteractionsBeforeDM: 3,
      aiEnabled: false,
      ...rules,
    };

    this.logger.log(
      `▶️ [MONITOR] Démarrage monitoring TikTok pour compte ${accountId} (workspace=${workspaceId})`,
    );
    this.logger.debug(
      `⚙️ [MONITOR] Règles: ${JSON.stringify(effectiveRules, null, 2)}`,
    );

    const intervalMs = 60_000; // 1 min – adapte selon ton usage

    const job = setInterval(async () => {
      this.logger.log(
        `⏰ [MONITOR] Tick monitoring pour compte ${accountId} – collecte des interactions...`,
      );

      try {
        // Tu peux faire un truc plus fin ici (passer les cookies, filtrer sur les règles, etc.)
        const res =
          await this.interactionsService.collectInteractionsForAccount(
            accountId,
          );

        this.logger.log(
          `✅ [MONITOR] Collecte terminée pour ${accountId} – collected=${res.collected}, created=${res.created}`,
        );
      } catch (error) {
        this.logger.error(
          `❌ [MONITOR] Erreur lors de la collecte pour ${accountId}: ${error.message}`,
        );
      }
    }, intervalMs);

    this.jobs.set(accountId, job);
  }

  /**
   * Stoppe le monitoring pour un compte.
   */
  stopMonitoring(accountId: string): void {
    const job = this.jobs.get(accountId);
    if (job) {
      clearInterval(job);
      this.jobs.delete(accountId);
      this.logger.log(`⏹️ [MONITOR] Monitoring arrêté pour ${accountId}`);
    } else {
      this.logger.warn(
        `⚠️ [MONITOR] stopMonitoring appelé pour ${accountId} mais aucun job trouvé.`,
      );
    }
  }

  /**
   * Permet à ton service social-accounts de vérifier l'état.
   */
  isMonitoring(accountId: string): boolean {
    return this.jobs.has(accountId);
  }
}
