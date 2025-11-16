import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InstagramService } from '../social-accounts/providers/instagram.service';
import { SocialAccountsService } from '../social-accounts/social-accounts.service';

@Injectable()
export class InteractionsService {
  constructor(
    private prisma: PrismaService,
    private instagramService: InstagramService,
    private socialAccountsService: SocialAccountsService,
  ) {}

  async collectInstagramInteractions(accountId: string) {
    const account = await this.prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account || account.platform !== 'instagram') {
      throw new Error('Invalid Instagram account');
    }

    const accessToken = await this.socialAccountsService.getDecryptedToken(
      accountId,
    );

    // Récupérer les médias récents
    const mediaResponse = await this.instagramService.getMedia(
      accessToken,
      account.platformUserId,
    );

    const interactions = [];

    // Traiter chaque média
    for (const media of mediaResponse.data || []) {
      // Récupérer les likes
      const likes = await this.instagramService.getMediaLikes(
        accessToken,
        media.id,
      );

      for (const like of likes) {
        interactions.push({
          workspaceId: account.workspaceId,
          socialAccountId: accountId,
          platform: 'instagram',
          type: 'like',
          actorId: like.id,
          actorUsername: like.username,
          contentRef: media.id,
          contentUrl: media.permalink,
          rawData: { media, like },
        });
      }

      // Récupérer les commentaires
      const comments = await this.instagramService.getMediaComments(
        accessToken,
        media.id,
      );

      for (const comment of comments) {
        interactions.push({
          workspaceId: account.workspaceId,
          socialAccountId: accountId,
          platform: 'instagram',
          type: 'comment',
          actorId: comment.id,
          actorUsername: comment.username,
          contentRef: media.id,
          contentUrl: media.permalink,
          message: comment.text,
          rawData: { media, comment },
        });
      }
    }

    // Insérer les interactions en base (éviter les doublons)
    const created = [];
    for (const interaction of interactions) {
      const existing = await this.prisma.interactionEvent.findFirst({
        where: {
          workspaceId: interaction.workspaceId,
          platform: interaction.platform,
          type: interaction.type,
          actorId: interaction.actorId,
          contentRef: interaction.contentRef,
        },
      });

      if (!existing) {
        const createdInteraction = await this.prisma.interactionEvent.create({
          data: interaction,
        });
        created.push(createdInteraction);
      }
    }

    return {
      collected: interactions.length,
      created: created.length,
      interactions: created,
    };
  }

  async findAll(workspaceId: string, filters?: any) {
    const where: any = { workspaceId };

    if (filters?.platform) {
      where.platform = filters.platform;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    return this.prisma.interactionEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
      skip: filters?.offset || 0,
    });
  }
}

