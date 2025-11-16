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

    return this.prisma.target.findMany({
      where,
      orderBy: { interestScore: 'desc' },
      take: filters?.limit || 100,
      skip: filters?.offset || 0,
      include: {
        _count: {
          select: {
            interactions: true,
          },
        },
      },
    });
  }
}

