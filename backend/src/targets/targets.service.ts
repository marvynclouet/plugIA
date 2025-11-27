import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TargetsService {
  constructor(private prisma: PrismaService) {}

  async calculateInterestScore(workspaceId: string, platform: string, platformUserId: string) {
    // Récupérer toutes les interactions de cet utilisateur
    const interactions = await this.prisma.interactionEvent.findMany({
      where: {
        workspaceId,
        platform,
        actorId: platformUserId,
      },
    });

    let score = 0;

    // Logique de scoring simple
    const interactionWeights = {
      like: 1,
      comment: 5,
      follow: 10,
      share: 15,
      save: 12,
      dm_received: 20,
    };

    const interactionCounts: Record<string, number> = {};
    for (const interaction of interactions) {
      interactionCounts[interaction.type] =
        (interactionCounts[interaction.type] || 0) + 1;
    }

    // Calculer le score
    for (const [type, count] of Object.entries(interactionCounts)) {
      const weight = interactionWeights[type] || 0;
      score += weight * Math.min(count, 5); // Max 5 interactions du même type comptent
    }

    // Bonus pour combinaisons
    if (interactionCounts.comment && interactionCounts.follow) {
      score += 10; // Commentaire + follow = intérêt fort
    }
    if (interactionCounts.comment && interactionCounts.share) {
      score += 15; // Commentaire + partage = intérêt très fort
    }
    if (interactionCounts.save) {
      score += 8; // Sauvegarde = intérêt fort
    }

    // Normaliser entre 0 et 100
    score = Math.min(score, 100);

    // Déterminer si ciblable (score >= 15)
    const isTargetable = score >= 15;

    return { score, isTargetable, interactionCounts };
  }

  async updateTargetsFromInteractions(workspaceId: string) {
    // Récupérer tous les acteurs uniques des interactions récentes
    const uniqueActors = await this.prisma.interactionEvent.groupBy({
      by: ['platform', 'actorId', 'actorUsername'],
      where: {
        workspaceId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 derniers jours
        },
      },
    });

    const updated = [];

    for (const actor of uniqueActors) {
      const { score, isTargetable, interactionCounts } =
        await this.calculateInterestScore(
          workspaceId,
          actor.platform,
          actor.actorId,
        );

      // Récupérer la dernière interaction
      const lastInteraction = await this.prisma.interactionEvent.findFirst({
        where: {
          workspaceId,
          platform: actor.platform,
          actorId: actor.actorId,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Upsert le target
      const target = await this.prisma.target.upsert({
        where: {
          workspaceId_platform_platformUserId: {
            workspaceId,
            platform: actor.platform,
            platformUserId: actor.actorId,
          },
        },
        update: {
          username: actor.actorUsername,
          interestScore: score,
          isTargetable,
          lastInteractionAt: lastInteraction?.createdAt,
          socialAccountId: lastInteraction?.socialAccountId,
        },
        create: {
          workspaceId,
          platform: actor.platform,
          platformUserId: actor.actorId,
          username: actor.actorUsername,
          interestScore: score,
          isTargetable,
          lastInteractionAt: lastInteraction?.createdAt,
          socialAccountId: lastInteraction?.socialAccountId,
        },
      });

      updated.push(target);
    }

    return { updated: updated.length, targets: updated };
  }

  async findAll(workspaceId: string, filters?: any) {
    const where: any = { workspaceId };

    if (filters?.platform) {
      where.platform = filters.platform;
    }

    if (filters?.isTargetable !== undefined) {
      where.isTargetable = filters.isTargetable === 'true';
    }

    if (filters?.minScore) {
      where.interestScore = { gte: parseFloat(filters.minScore) };
    }

    // Convertir limit et offset en nombres, avec validation
    const limit = filters?.limit 
      ? (typeof filters.limit === 'string' ? parseInt(filters.limit, 10) : Number(filters.limit))
      : 100;
    const offset = filters?.offset 
      ? (typeof filters.offset === 'string' ? parseInt(filters.offset, 10) : Number(filters.offset))
      : 0;

    // S'assurer que ce sont des nombres valides
    const take = isNaN(limit) || limit < 0 ? 100 : Math.floor(limit);
    const skip = isNaN(offset) || offset < 0 ? 0 : Math.floor(offset);

    return this.prisma.target.findMany({
      where,
      orderBy: { interestScore: 'desc' },
      take,
      skip,
      include: {
        _count: {
          select: {
            interactions: true,
          },
        },
      },
    });
  }

  /**
   * Récupère les utilisateurs intéressés (score >= 15) avec leurs interactions
   * C'est cette méthode qui permet de voir "TIENS lui a l'air intéressé"
   */
  async getInterestedUsers(workspaceId: string, platform?: string) {
    // D'abord, mettre à jour les scores depuis les interactions récentes
    await this.updateTargetsFromInteractions(workspaceId);

    const where: any = {
      workspaceId,
      isTargetable: true, // Seulement les utilisateurs avec score >= 15
      interestScore: { gte: 15 }, // Minimum 15 pour être considéré comme intéressé
    };

    if (platform) {
      where.platform = platform;
    }

    const interestedUsers = await this.prisma.target.findMany({
      where,
      orderBy: { interestScore: 'desc' }, // Les plus intéressés en premier
      take: 50, // Top 50
      include: {
        _count: {
          select: {
            interactions: true,
          },
        },
        interactions: {
          take: 5, // Les 5 dernières interactions
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Enrichir avec les détails des interactions
    return interestedUsers.map((user) => ({
      id: user.id,
      username: user.username,
      platform: user.platform,
      interestScore: user.interestScore,
      isTargetable: user.isTargetable,
      lastInteractionAt: user.lastInteractionAt,
      totalInteractions: user._count.interactions,
      recentInteractions: user.interactions.map((interaction) => ({
        type: interaction.type,
        message: interaction.message,
        createdAt: interaction.createdAt,
      })),
    }));
  }
}

