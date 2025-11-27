// backend/src/social-accounts/providers/social-connection.service.ts

import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { SocialAccountsService } from '../social-accounts.service';
import { InstagramService } from './instagram.service';
import { FacebookService } from './facebook.service';
import { TikTokQRConnectionService } from './tiktok-qr-connection.service';

export type ConnectionMethod = 'oauth' | 'qr_code' | 'cookies' | 'manual';

export interface ConnectionInitResponse {
  method: ConnectionMethod;
  connectionId?: string;
  authUrl?: string;
  qrCodeBase64?: string;
  instructions?: string;
  expiresAt?: Date;
}

export interface ConnectionStatus {
  status: 'waiting' | 'scanning' | 'connected' | 'expired' | 'error';
  username?: string;
  error?: string;
  expiresAt?: Date;
}

@Injectable()
export class SocialConnectionService {
  private readonly logger = new Logger(SocialConnectionService.name);

  constructor(
    @Inject(forwardRef(() => SocialAccountsService))
    private socialAccountsService: SocialAccountsService,
    private instagramService: InstagramService,
    private facebookService: FacebookService,
    private tiktokQRConnectionService: TikTokQRConnectionService,
  ) {}

  /**
   * Initie une connexion pour n'importe quelle plateforme
   */
  async initiateConnection(
    platform: string,
    workspaceId: string,
  ): Promise<ConnectionInitResponse> {
    this.logger.log(`🔐 [CONNECTION] Initiation connexion ${platform} pour workspace: ${workspaceId}`);

    switch (platform.toLowerCase()) {
      case 'instagram':
        return this.initiateInstagramConnection(workspaceId);

      case 'facebook':
        return this.initiateFacebookConnection(workspaceId);

      case 'tiktok':
        return this.initiateTikTokConnection(workspaceId);

      default:
        throw new Error(`Plateforme non supportée: ${platform}`);
    }
  }

  /**
   * Instagram - OAuth
   */
  private async initiateInstagramConnection(
    workspaceId: string,
  ): Promise<ConnectionInitResponse> {
    const authUrl = await this.socialAccountsService.getInstagramAuthUrl(workspaceId);
    return {
      method: 'oauth',
      authUrl,
      instructions: 'Vous allez être redirigé vers Instagram pour autoriser l\'accès.',
    };
  }

  /**
   * Facebook - OAuth
   */
  private async initiateFacebookConnection(
    workspaceId: string,
  ): Promise<ConnectionInitResponse> {
    const authUrl = await this.socialAccountsService.getFacebookAuthUrl(workspaceId);
    return {
      method: 'oauth',
      authUrl,
      instructions: 'Vous allez être redirigé vers Facebook pour autoriser l\'accès.',
    };
  }

  /**
   * TikTok - QR Code (méthode principale) ou Cookies (fallback)
   */
  private async initiateTikTokConnection(
    workspaceId: string,
  ): Promise<ConnectionInitResponse> {
    // Par défaut, utiliser QR code
    const useQRCode = process.env.TIKTOK_USE_QR !== 'false';

    if (useQRCode) {
      try {
        const qrConnection = await this.socialAccountsService.initiateTikTokQRConnection(
          workspaceId,
        );
        return {
          method: 'qr_code',
          connectionId: qrConnection.connectionId,
          qrCodeBase64: qrConnection.qrCodeBase64,
          expiresAt: qrConnection.expiresAt,
          instructions:
            'Scannez le QR code avec l\'application TikTok sur votre téléphone.',
        };
      } catch (error) {
        this.logger.warn(
          `⚠️ [CONNECTION] QR code échoué, fallback vers cookies: ${error.message}`,
        );
        // Fallback vers cookies manuels
        return {
          method: 'cookies',
          instructions:
            'Veuillez copier vos cookies TikTok depuis votre navigateur (F12 → Application → Cookies).',
        };
      }
    }

    // Méthode cookies manuelle
    return {
      method: 'cookies',
      instructions:
        'Veuillez copier vos cookies TikTok depuis votre navigateur (F12 → Application → Cookies).',
    };
  }

  /**
   * Récupère le statut d'une connexion en cours
   */
  async getConnectionStatus(
    platform: string,
    connectionId: string,
  ): Promise<ConnectionStatus | null> {
    if (platform.toLowerCase() === 'tiktok') {
      const status = await this.socialAccountsService.getTikTokQRConnectionStatus(connectionId);
      return {
        status: status.status as ConnectionStatus['status'],
        username: status.username,
        error: status.error,
        expiresAt: status.expiresAt,
      };
    }

    // Pour OAuth, le statut est géré via le callback
    return null;
  }

  /**
   * Complète une connexion et crée le compte
   */
  async completeConnection(
    platform: string,
    workspaceId: string,
    connectionId?: string,
    cookies?: string[],
    oauthCode?: string,
  ): Promise<{
    accountId: string;
    username: string;
    platform: string;
  }> {
    this.logger.log(
      `✅ [CONNECTION] Finalisation connexion ${platform} pour workspace: ${workspaceId}`,
    );

    switch (platform.toLowerCase()) {
      case 'instagram':
        if (!oauthCode) {
          throw new Error('Code OAuth requis pour Instagram');
        }
        const instagramAccount = await this.socialAccountsService.handleInstagramCallback(
          oauthCode,
          workspaceId,
        );
        return {
          accountId: instagramAccount.id,
          username: instagramAccount.platformUsername,
          platform: 'instagram',
        };

      case 'facebook':
        if (!oauthCode) {
          throw new Error('Code OAuth requis pour Facebook');
        }
        const facebookAccount = await this.socialAccountsService.handleFacebookCallback(
          oauthCode,
          workspaceId,
        );
        return {
          accountId: facebookAccount.id,
          username: facebookAccount.platformUsername,
          platform: 'facebook',
        };

      case 'tiktok':
        if (connectionId) {
          // Connexion QR code
          const qrResult = await this.socialAccountsService.completeTikTokQRConnection(
            connectionId,
            workspaceId,
          );
          return {
            accountId: qrResult.accountId,
            username: qrResult.username,
            platform: 'tiktok',
          };
        } else if (cookies && cookies.length > 0) {
          // Connexion cookies manuels
          const cookieResult = await this.socialAccountsService.createTikTokAccountFromCookies(
            workspaceId,
            cookies,
          );
          return {
            accountId: cookieResult.accountId,
            username: cookieResult.username,
            platform: 'tiktok',
          };
        } else {
          throw new Error('ConnectionId ou cookies requis pour TikTok');
        }

      default:
        throw new Error(`Plateforme non supportée: ${platform}`);
    }
  }

  /**
   * Liste les méthodes de connexion disponibles pour une plateforme
   */
  getAvailableMethods(platform: string): ConnectionMethod[] {
    switch (platform.toLowerCase()) {
      case 'instagram':
      case 'facebook':
        return ['oauth'];

      case 'tiktok':
        const useQRCode = process.env.TIKTOK_USE_QR !== 'false';
        return useQRCode ? ['qr_code', 'cookies'] : ['cookies'];

      default:
        return [];
    }
  }
}

