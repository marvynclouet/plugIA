import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { SocialAccountsService } from '../social-accounts/social-accounts.service';
import { InstagramService } from '../social-accounts/providers/instagram.service';

@Injectable()
export class DmService {
  constructor(
    @InjectQueue('dm') private dmQueue: Queue,
    private prisma: PrismaService,
    private socialAccountsService: SocialAccountsService,
    private instagramService: InstagramService,
  ) {}

  async checkQuota(accountId: string, type: string = 'dm_per_day'): Promise<boolean> {
    const now = new Date();
    const resetAt = new Date(now);
    resetAt.setHours(24, 0, 0, 0); // Minuit prochain

    const quota = await this.prisma.quota.findFirst({
      where: {
        socialAccountId: accountId,
        type,
        resetAt: {
          gte: now,
        },
      },
    });

    if (!quota) {
      // Créer un nouveau quota
      await this.prisma.quota.create({
        data: {
          workspaceId: (await this.prisma.socialAccount.findUnique({
            where: { id: accountId },
          }))!.workspaceId,
          socialAccountId: accountId,
          type,
          limit: 50, // 50 DM par jour par défaut
          current: 0,
          resetAt,
        },
      });
      return true;
    }

    return quota.current < quota.limit;
  }

  async incrementQuota(accountId: string, type: string = 'dm_per_day') {
    const now = new Date();
    const quota = await this.prisma.quota.findFirst({
      where: {
        socialAccountId: accountId,
        type,
        resetAt: {
          gte: now,
        },
      },
    });

    if (quota) {
      await this.prisma.quota.update({
        where: { id: quota.id },
        data: {
          current: quota.current + 1,
        },
      });
    }
  }

  async sendDm(
    accountId: string,
    targetId: string,
    template: string,
    variables?: Record<string, string>,
  ) {
    // Vérifier le quota
    const canSend = await this.checkQuota(accountId);
    if (!canSend) {
      throw new Error('Daily quota exceeded');
    }

    const account = await this.prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    const target = await this.prisma.target.findUnique({
      where: { id: targetId },
    });

    if (!account || !target) {
      throw new Error('Account or target not found');
    }

    // Remplacer les variables dans le template
    let message = template;
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
    }

    // Remplacer les variables par défaut
    message = message.replace(/{{username}}/g, target.username);
    message = message.replace(/{{platform}}/g, target.platform);

    // Créer la séquence DM
    const sequence = await this.prisma.dmSequence.create({
      data: {
        workspaceId: account.workspaceId,
        socialAccountId: accountId,
        targetId,
        status: 'pending',
        currentStep: 0,
        totalSteps: 1,
      },
    });

    // Ajouter à la queue
    await this.dmQueue.add('send-dm', {
      sequenceId: sequence.id,
      accountId,
      targetId,
      message,
    });

    return sequence;
  }

  async executeDm(sequenceId: string, message: string) {
    const sequence = await this.prisma.dmSequence.findUnique({
      where: { id: sequenceId },
      include: {
        socialAccount: true,
        target: true,
      },
    });

    if (!sequence) {
      throw new Error('Sequence not found');
    }

    const accessToken = await this.socialAccountsService.getDecryptedToken(
      sequence.socialAccountId,
    );

    try {
      // Envoyer le DM via l'API Instagram
      await this.instagramService.sendDirectMessage(
        accessToken,
        sequence.target.platformUserId,
        message,
      );

      // Enregistrer le message
      await this.prisma.dmMessage.create({
        data: {
          sequenceId,
          direction: 'sent',
          content: message,
        },
      });

      // Mettre à jour la séquence
      await this.prisma.dmSequence.update({
        where: { id: sequenceId },
        data: {
          status: 'sent',
          lastMessageAt: new Date(),
        },
      });

      // Incrémenter le quota
      await this.incrementQuota(sequence.socialAccountId);

      return { success: true };
    } catch (error) {
      await this.prisma.dmSequence.update({
        where: { id: sequenceId },
        data: {
          status: 'failed',
        },
      });
      throw error;
    }
  }

  async getTemplates(workspaceId: string) {
    // Pour le MVP, templates simples en dur
    // Plus tard, on pourra les stocker en base
    return [
      {
        id: 'default',
        name: 'Message par défaut',
        content:
          'Salut {{username}} ! 👋\n\nMerci pour ton intérêt sur {{platform}} ! J\'aimerais en savoir plus sur tes besoins. Peux-tu me partager ton numéro de téléphone pour qu\'on puisse discuter ?',
      },
      {
        id: 'casual',
        name: 'Message décontracté',
        content:
          'Hey {{username}} ! 😊\n\nJ\'ai vu que tu étais intéressé(e) par mon contenu. On pourrait échanger si tu veux ! Envoie-moi ton numéro et je te recontacte rapidement.',
      },
    ];
  }
}

