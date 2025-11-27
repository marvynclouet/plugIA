import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InstagramService } from '../social-accounts/providers/instagram.service';
import { SocialAccountsService } from '../social-accounts/social-accounts.service';
import { TikTokBrowserService } from '../social-accounts/providers/tiktok-browser.service';
import axios from 'axios';

@Injectable()
export class InteractionsService {
  private readonly logger = new Logger(InteractionsService.name);

  constructor(
    private prisma: PrismaService,
    private instagramService: InstagramService,
    @Inject(forwardRef(() => SocialAccountsService))
    private socialAccountsService: SocialAccountsService,
    private tiktokBrowserService: TikTokBrowserService,
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

    this.logger.log(`🔄 Starting comprehensive Instagram interaction collection for account: ${accountId}`);
    
    // Récupérer TOUS les médias avec pagination
    let allMedia = [];
    let nextPageUrl = null;
    let pageCount = 0;
    const maxPages = 50; // Limite de sécurité pour éviter les boucles infinies

    do {
      pageCount++;
      this.logger.log(`📄 Fetching Instagram media page ${pageCount}...`);
      
      const mediaResponse = nextPageUrl
        ? await axios.get(nextPageUrl)
        : await this.instagramService.getMedia(accessToken, account.platformUserId);
      
      if (mediaResponse.data) {
        allMedia = allMedia.concat(mediaResponse.data);
        this.logger.log(`✅ Found ${mediaResponse.data.length} media items (total: ${allMedia.length})`);
      }
      
      // Vérifier s'il y a une page suivante
      nextPageUrl = mediaResponse.paging?.next || null;
      
      // Petite pause entre les pages pour éviter les rate limits
      if (nextPageUrl && pageCount < maxPages) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } while (nextPageUrl && pageCount < maxPages);

    this.logger.log(`📊 Total media collected: ${allMedia.length} posts`);

    const interactions = [];

    // Traiter chaque média
    for (let i = 0; i < allMedia.length; i++) {
      const media = allMedia[i];
      this.logger.log(`📸 Processing media ${i + 1}/${allMedia.length}: ${media.id}`);
      
      try {
        // Récupérer les likes avec pagination
        let allLikes = [];
        let likesNextPage = null;
        let likesPageCount = 0;
        
        do {
          const likesResponse = likesNextPage
            ? await axios.get(likesNextPage)
            : await this.instagramService.getMediaLikes(accessToken, media.id);
          
          if (Array.isArray(likesResponse)) {
            allLikes = allLikes.concat(likesResponse);
            likesNextPage = null;
          } else if (likesResponse.data) {
            allLikes = allLikes.concat(likesResponse.data);
            likesNextPage = likesResponse.paging?.next || null;
          }
          
          likesPageCount++;
          
          if (likesNextPage && likesPageCount < 10) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } while (likesNextPage && likesPageCount < 10);

        this.logger.log(`  ❤️  Found ${allLikes.length} likes for media ${media.id}`);

        for (const like of allLikes) {
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

        // Récupérer les commentaires avec pagination
        let allComments = [];
        let commentsNextPage = null;
        let commentsPageCount = 0;
        
        do {
          let commentsResponse;
          if (commentsNextPage) {
            commentsResponse = await axios.get(commentsNextPage);
            commentsResponse = commentsResponse.data;
          } else {
            const response = await axios.get(
              `https://graph.facebook.com/v18.0/${media.id}/comments`,
              {
                params: {
                  fields: 'id,text,username,timestamp,like_count',
                  access_token: accessToken,
                },
              },
            );
            commentsResponse = response.data;
          }
          
          // Gérer les deux formats possibles : array direct ou objet avec data
          let commentsData = [];
          if (Array.isArray(commentsResponse)) {
            commentsData = commentsResponse;
            commentsNextPage = null;
          } else if (Array.isArray(commentsResponse.data)) {
            commentsData = commentsResponse.data;
            commentsNextPage = commentsResponse.paging?.next || null;
          }
          
          allComments = allComments.concat(commentsData);
          commentsPageCount++;
          
          if (commentsNextPage && commentsPageCount < 10) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } while (commentsNextPage && commentsPageCount < 10);

        this.logger.log(`  💬 Found ${allComments.length} comments for media ${media.id}`);

        for (const comment of allComments) {
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

        // Petite pause entre chaque média pour éviter les rate limits
        if (i < allMedia.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        this.logger.warn(`⚠️ Error processing media ${media.id}:`, error.message);
        // Continuer avec le média suivant même en cas d'erreur
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

    const interactions = await this.prisma.interactionEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: {
        target: {
          include: {
            dmSequences: {
              where: {
                status: { in: ['sent', 'replied', 'completed'] },
              },
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    // Enrichir avec le statut d'envoi de message
    return interactions.map((interaction) => {
      const hasMessageSent = interaction.target?.dmSequences?.length > 0;
      return {
        ...interaction,
        messageSent: hasMessageSent,
        messageSentAt: hasMessageSent ? interaction.target.dmSequences[0].lastMessageAt : null,
      };
    });
  }

  /**
   * Collecte et enregistre les interactions TikTok dans la base de données
   */
  async collectTikTokInteractions(accountId: string) {
    const account = await this.prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account || account.platform !== 'tiktok') {
      throw new Error('Invalid TikTok account');
    }

    // Récupérer les cookies
    const cookies: string[] = account.scopes?.includes('browser_cookies')
      ? JSON.parse(account.scopes.find((s: string) => s.startsWith('cookies:'))?.replace('cookies:', '') || '[]')
      : [];

    if (cookies.length === 0) {
      this.logger.warn('No TikTok cookies found for account:', accountId);
      return { collected: 0, created: 0, interactions: [] };
    }

    try {
      // Récupérer toutes les interactions via le service browser
      const interactionsData = await this.tiktokBrowserService.getAllInteractions(cookies);
      
      const interactions = [];

      // Traiter les likes
      for (const like of interactionsData.likes || []) {
        interactions.push({
          workspaceId: account.workspaceId,
          socialAccountId: accountId,
          platform: 'tiktok',
          type: 'like',
          actorId: like.username || `user_${Date.now()}`,
          actorUsername: like.username || 'unknown',
          contentRef: like.videoId || null,
          contentUrl: like.videoUrl || null,
          rawData: like,
        });
      }

      // Traiter les commentaires
      for (const comment of interactionsData.comments || []) {
        interactions.push({
          workspaceId: account.workspaceId,
          socialAccountId: accountId,
          platform: 'tiktok',
          type: 'comment',
          actorId: comment.username || `user_${Date.now()}`,
          actorUsername: comment.username || 'unknown',
          contentRef: comment.videoId || null,
          contentUrl: comment.videoUrl || null,
          message: comment.comment || comment.text || null,
          rawData: comment,
        });
      }

      // Traiter les follows
      for (const follow of interactionsData.follows || []) {
        interactions.push({
          workspaceId: account.workspaceId,
          socialAccountId: accountId,
          platform: 'tiktok',
          type: 'follow',
          actorId: follow.username || `user_${Date.now()}`,
          actorUsername: follow.username || 'unknown',
          rawData: follow,
        });
      }

      // Traiter les shares
      for (const share of interactionsData.shares || []) {
        interactions.push({
          workspaceId: account.workspaceId,
          socialAccountId: accountId,
          platform: 'tiktok',
          type: 'share',
          actorId: share.username || `user_${Date.now()}`,
          actorUsername: share.username || 'unknown',
          contentRef: share.videoId || null,
          contentUrl: share.videoUrl || null,
          rawData: share,
        });
      }

      // Traiter les mentions
      for (const mention of interactionsData.mentions || []) {
        interactions.push({
          workspaceId: account.workspaceId,
          socialAccountId: accountId,
          platform: 'tiktok',
          type: 'mention',
          actorId: mention.username || `user_${Date.now()}`,
          actorUsername: mention.username || 'unknown',
          contentRef: mention.videoId || null,
          contentUrl: mention.videoUrl || null,
          message: mention.text || null,
          rawData: mention,
        });
      }

      // Insérer les interactions en base (éviter les doublons)
      // On vérifie si l'interaction existe déjà (peu importe la date) pour éviter les doublons
      // Mais on récupère TOUT l'historique disponible
      const created = [];
      for (const interaction of interactions) {
        // Vérifier si une interaction similaire existe déjà (sans limite de date)
        // On utilise actorId + type + contentRef comme clé unique
        const existing = await this.prisma.interactionEvent.findFirst({
          where: {
            workspaceId: interaction.workspaceId,
            platform: interaction.platform,
            type: interaction.type,
            actorId: interaction.actorId,
            contentRef: interaction.contentRef || undefined,
            // Pas de filtre de date - on vérifie toutes les interactions existantes
          },
        });

        if (!existing) {
          const createdInteraction = await this.prisma.interactionEvent.create({
            data: interaction,
          });
          created.push(createdInteraction);
        }
      }

      this.logger.log(`✅ TikTok interactions collected: ${created.length} new interactions from ${interactions.length} total`);

      return {
        collected: interactions.length,
        created: created.length,
        interactions: created,
      };
    } catch (error) {
      this.logger.error('Error collecting TikTok interactions:', error);
      throw error;
    }
  }

  /**
   * Collecte automatiquement les interactions pour un compte après connexion
   */
  async collectInteractionsForAccount(accountId: string) {
    this.logger.log(`🔄 [COLLECT] collectInteractionsForAccount called for accountId: ${accountId}`);
    
    const account = await this.prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      this.logger.error(`❌ [COLLECT] Account not found: ${accountId}`);
      throw new Error('Account not found');
    }

    this.logger.log(`🔄 [COLLECT] Collecting interactions for ${account.platform} account: ${accountId}`);
    this.logger.log(`🔄 [COLLECT] Account details:`, {
      platform: account.platform,
      username: account.platformUsername,
      workspaceId: account.workspaceId,
    });

    try {
      switch (account.platform) {
        case 'instagram':
          this.logger.log(`📸 [COLLECT] Starting Instagram collection...`);
          return await this.collectInstagramInteractions(accountId);
        case 'tiktok':
          this.logger.log(`🎵 [COLLECT] Starting TikTok collection...`);
          return await this.collectTikTokInteractions(accountId);
        default:
          this.logger.warn(`⚠️ [COLLECT] Interaction collection not implemented for platform: ${account.platform}`);
          return { collected: 0, created: 0, interactions: [] };
      }
    } catch (error) {
      this.logger.error(`❌ [COLLECT] Error collecting interactions for ${account.platform}:`, error);
      this.logger.error(`❌ [COLLECT] Error stack:`, error.stack);
      // Ne pas faire échouer la connexion si la collecte échoue
      return { collected: 0, created: 0, interactions: [], error: error.message };
    }
  }
}

