// backend/src/social-accounts/providers/tiktok-reconnection.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TikTokQRConnectionService } from './tiktok-qr-connection.service';
import { SocialAccountsService } from '../social-accounts.service';

@Injectable()
export class TikTokReconnectionService {
  private readonly logger = new Logger(TikTokReconnectionService.name);
  private readonly reconnectingAccounts = new Set<string>(); // Pour éviter les doublons

  constructor(
    private prisma: PrismaService,
    private qrConnectionService: TikTokQRConnectionService,
    private socialAccountsService: SocialAccountsService,
  ) {}

  /**
   * Détecte les sessions expirées et initie la reconnexion
   */
  async detectAndReconnectExpiredSessions(): Promise<void> {
    this.logger.log('🔍 [RECONNECTION] Vérification des sessions expirées...');

    // Récupérer tous les comptes TikTok expirés (utiliser metadata.status)
    const allAccounts = await this.prisma.socialAccount.findMany({
      where: {
        platform: 'tiktok',
        isActive: false,
      },
    });

    // Tous les comptes inactifs sont considérés comme expirés
    const expiredAccounts = allAccounts;

    this.logger.log(
      `📊 [RECONNECTION] ${expiredAccounts.length} comptes expirés trouvés`,
    );

    for (const account of expiredAccounts) {
      try {
        await this.reconnectAccount(account.id, account.workspaceId);
      } catch (error) {
        this.logger.error(
          `❌ [RECONNECTION] Erreur pour account ${account.id}: ${error.message}`,
        );
      }
    }
  }

  /**
   * Reconnecte un compte TikTok via QR code
   */
  async reconnectAccount(
    accountId: string,
    workspaceId: string,
  ): Promise<{ connectionId: string; qrCodeBase64: string }> {
    // Éviter les reconnexions simultanées
    if (this.reconnectingAccounts.has(accountId)) {
      throw new Error('Reconnexion déjà en cours pour ce compte');
    }

    this.reconnectingAccounts.add(accountId);

    try {
      this.logger.log(
        `🔄 [RECONNECTION] Initiation reconnexion pour account: ${accountId}`,
      );

      // Marquer le compte comme "reconnecting" (utiliser isActive)
      await this.prisma.socialAccount.update({
        where: { id: accountId },
        data: {
          isActive: false,
        },
      });

      // Initier la connexion QR code
      const connection = await this.qrConnectionService.initiateQRConnection(
        workspaceId,
      );

      // Stocker le connectionId (on peut utiliser un cache en mémoire ou une table séparée)
      // Pour l'instant, on le garde dans le service

      this.logger.log(
        `✅ [RECONNECTION] QR code généré pour account: ${accountId}`,
      );

      return {
        connectionId: connection.connectionId,
        qrCodeBase64: connection.qrCodeBase64,
      };
    } catch (error) {
      this.logger.error(
        `❌ [RECONNECTION] Erreur lors de la reconnexion: ${error.message}`,
      );
      throw error;
    } finally {
      this.reconnectingAccounts.delete(accountId);
    }
  }

  /**
   * Vérifie le statut d'une reconnexion et finalise si connecté
   */
  async checkReconnectionStatus(accountId: string): Promise<{
    status: 'scanning' | 'connected' | 'expired' | 'error' | 'waiting';
    username?: string;
  }> {
    const account = await this.prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return { status: 'error' };
    }

    // Pour l'instant, on ne stocke pas le connectionId en DB
    // Il faudrait créer une table séparée ou utiliser un cache Redis
    // Pour cette version, on retourne une erreur
    // TODO: Implémenter un système de stockage du connectionId
    
    return { status: 'error' };
  }

  /**
   * Finalise la reconnexion : met à jour les cookies et le statut
   */
  private async finalizeReconnection(
    accountId: string,
    connectionStatus: any,
  ): Promise<void> {
    this.logger.log(
      `✅ [RECONNECTION] Finalisation reconnexion pour account: ${accountId}`,
    );

    // Récupérer les cookies depuis la connexion QR
    const cookies = connectionStatus.cookies || [];

    if (cookies.length === 0) {
      throw new Error('Aucun cookie récupéré lors de la reconnexion');
    }

    // Mettre à jour les cookies dans la base
    // Récupérer la session existante
    const session = await this.prisma.socialSession.findUnique({
      where: { socialAccountId: accountId },
    });

    if (session) {
      // Mettre à jour les cookies chiffrés
      const encryptedCookies = this.socialAccountsService.encryptCookies(
        cookies.map((c) => `${c.name}=${c.value}`),
      );
      await this.prisma.socialSession.update({
        where: { socialAccountId: accountId },
        data: { cookies: encryptedCookies },
      });
    } else {
      // Créer une nouvelle session
      const encryptedCookies = this.socialAccountsService.encryptCookies(
        cookies.map((c) => `${c.name}=${c.value}`),
      );
      await this.prisma.socialSession.create({
        data: {
          socialAccountId: accountId,
          cookies: encryptedCookies,
        },
      });
    }

      // Récupérer le compte pour avoir le platformUsername actuel
      const account = await this.prisma.socialAccount.findUnique({
        where: { id: accountId },
      });

      // Mettre à jour le compte (utiliser platformUsername au lieu de username)
      await this.prisma.socialAccount.update({
        where: { id: accountId },
        data: {
          isActive: true,
          platformUsername: connectionStatus.username || account?.platformUsername || '',
        },
      });

    this.logger.log(
      `✅ [RECONNECTION] Reconnexion finalisée pour account: ${accountId}`,
    );
  }

  /**
   * Vérifie automatiquement les sessions expirées et tente de reconnecter
   * Appelé par un job cron
   */
  async autoReconnectExpiredSessions(): Promise<void> {
    this.logger.log(
      '🔄 [RECONNECTION] Vérification automatique des sessions expirées...',
    );

    // Récupérer les comptes expirés depuis plus de 1 heure
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const allAccounts = await this.prisma.socialAccount.findMany({
      where: {
        platform: 'tiktok',
        isActive: false,
        updatedAt: {
          lte: oneHourAgo, // Expiré depuis plus d'1 heure
        },
      },
    });

    // Tous les comptes inactifs sont considérés comme expirés
    const expiredAccounts = allAccounts;

    // Charger les workspaces pour les comptes expirés
    const expiredAccountsWithWorkspace = await Promise.all(
      expiredAccounts.map(async (acc) => {
        const workspace = await this.prisma.workspace.findUnique({
          where: { id: acc.workspaceId },
        });
        return { ...acc, workspace };
      }),
    );

    for (const account of expiredAccountsWithWorkspace) {
      try {
        this.logger.log(
          `🔄 [RECONNECTION] Tentative reconnexion automatique pour account: ${account.id}`,
        );

        // Initier la reconnexion (l'utilisateur devra scanner le QR)
        await this.reconnectAccount(account.id, account.workspaceId);

        // TODO: Envoyer une notification à l'utilisateur pour qu'il scanne le QR
        // TODO: Stocker le QR code dans les métadonnées pour l'afficher dans le dashboard
      } catch (error) {
        this.logger.error(
          `❌ [RECONNECTION] Erreur reconnexion automatique: ${error.message}`,
        );
      }
    }
  }
}

