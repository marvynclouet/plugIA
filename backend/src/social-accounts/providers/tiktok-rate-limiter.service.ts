// backend/src/social-accounts/providers/tiktok-rate-limiter.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface RateLimitConfig {
  maxDMsPerHour: number;
  maxDMsPerDay: number;
  maxActionsPerHour: number; // Actions totales (DM + likes + comments)
}

@Injectable()
export class TikTokRateLimiterService {
  private readonly logger = new Logger(TikTokRateLimiterService.name);
  private readonly defaultConfig: RateLimitConfig = {
    maxDMsPerHour: 10,
    maxDMsPerDay: 50,
    maxActionsPerHour: 30,
  };

  // Cache en mémoire pour les limites (pour éviter trop de requêtes DB)
  private readonly rateLimitCache = new Map<
    string,
    { count: number; resetAt: Date }
  >();

  constructor(private prisma: PrismaService) {}

  /**
   * Vérifie si on peut envoyer un DM (rate limiting)
   */
  async canSendDM(accountId: string): Promise<{
    allowed: boolean;
    reason?: string;
    retryAfter?: number; // En secondes
  }> {
    const config = this.defaultConfig;

    // Vérifier la limite par heure
    const hourlyKey = `dm_hour_${accountId}`;
    const hourlyCount = await this.getRateLimitCount(hourlyKey, 3600); // 1 heure

    if (hourlyCount >= config.maxDMsPerHour) {
      const retryAfter = await this.getRetryAfter(hourlyKey, 3600);
      return {
        allowed: false,
        reason: `Limite de ${config.maxDMsPerHour} DM/heure atteinte`,
        retryAfter,
      };
    }

    // Vérifier la limite par jour
    const dailyKey = `dm_day_${accountId}`;
    const dailyCount = await this.getRateLimitCount(dailyKey, 86400); // 24 heures

    if (dailyCount >= config.maxDMsPerDay) {
      const retryAfter = await this.getRetryAfter(dailyKey, 86400);
      return {
        allowed: false,
        reason: `Limite de ${config.maxDMsPerDay} DM/jour atteinte`,
        retryAfter,
      };
    }

    return { allowed: true };
  }

  /**
   * Enregistre l'envoi d'un DM (incrémente le compteur)
   */
  async recordDMSent(accountId: string): Promise<void> {
    const hourlyKey = `dm_hour_${accountId}`;
    const dailyKey = `dm_day_${accountId}`;

    await this.incrementRateLimit(hourlyKey, 3600);
    await this.incrementRateLimit(dailyKey, 86400);

    this.logger.log(`📊 [RATE LIMIT] DM enregistré pour account: ${accountId}`);
  }

  /**
   * Vérifie si on peut effectuer une action (like, comment, etc.)
   */
  async canPerformAction(accountId: string): Promise<{
    allowed: boolean;
    reason?: string;
    retryAfter?: number;
  }> {
    const config = this.defaultConfig;

    const hourlyKey = `actions_hour_${accountId}`;
    const hourlyCount = await this.getRateLimitCount(hourlyKey, 3600);

    if (hourlyCount >= config.maxActionsPerHour) {
      const retryAfter = await this.getRetryAfter(hourlyKey, 3600);
      return {
        allowed: false,
        reason: `Limite de ${config.maxActionsPerHour} actions/heure atteinte`,
        retryAfter,
      };
    }

    return { allowed: true };
  }

  /**
   * Enregistre une action effectuée
   */
  async recordAction(accountId: string): Promise<void> {
    const hourlyKey = `actions_hour_${accountId}`;
    await this.incrementRateLimit(hourlyKey, 3600);
  }

  /**
   * Récupère le nombre d'actions pour une clé de rate limit
   */
  private async getRateLimitCount(
    key: string,
    ttlSeconds: number,
  ): Promise<number> {
    // Vérifier le cache en mémoire
    const cached = this.rateLimitCache.get(key);
    if (cached && cached.resetAt > new Date()) {
      return cached.count;
    }

    // Récupérer depuis la DB (ou créer si n'existe pas)
    const now = new Date();
    const resetAt = new Date(now.getTime() + ttlSeconds * 1000);

    // Utiliser une table de rate limiting ou les métadonnées du compte
    // Pour simplifier, on utilise le cache en mémoire avec sauvegarde optionnelle en DB

    // Si pas dans le cache, initialiser à 0
    if (!cached) {
      this.rateLimitCache.set(key, { count: 0, resetAt });
      return 0;
    }

    // Si expiré, réinitialiser
    if (cached.resetAt <= now) {
      this.rateLimitCache.set(key, { count: 0, resetAt });
      return 0;
    }

    return cached.count;
  }

  /**
   * Incrémente le compteur de rate limit
   */
  private async incrementRateLimit(
    key: string,
    ttlSeconds: number,
  ): Promise<void> {
    const now = new Date();
    const resetAt = new Date(now.getTime() + ttlSeconds * 1000);

    const cached = this.rateLimitCache.get(key);
    const currentCount = cached && cached.resetAt > now ? cached.count : 0;

    this.rateLimitCache.set(key, {
      count: currentCount + 1,
      resetAt,
    });
  }

  /**
   * Calcule le temps d'attente avant de pouvoir réessayer
   */
  private async getRetryAfter(key: string, ttlSeconds: number): Promise<number> {
    const cached = this.rateLimitCache.get(key);
    if (!cached) {
      return 0;
    }

    const now = new Date();
    if (cached.resetAt <= now) {
      return 0;
    }

    return Math.ceil((cached.resetAt.getTime() - now.getTime()) / 1000);
  }

  /**
   * Réinitialise tous les rate limits pour un compte (utile pour les tests)
   */
  async resetRateLimits(accountId: string): Promise<void> {
    const keys = [
      `dm_hour_${accountId}`,
      `dm_day_${accountId}`,
      `actions_hour_${accountId}`,
    ];

    for (const key of keys) {
      this.rateLimitCache.delete(key);
    }

    this.logger.log(
      `🔄 [RATE LIMIT] Rate limits réinitialisés pour account: ${accountId}`,
    );
  }

  /**
   * Nettoie les entrées expirées du cache
   */
  cleanupExpiredEntries(): void {
    const now = new Date();
    for (const [key, value] of this.rateLimitCache.entries()) {
      if (value.resetAt <= now) {
        this.rateLimitCache.delete(key);
      }
    }
  }
}


