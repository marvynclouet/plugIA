import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { VisionService } from './vision.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyzeScreenshotDto } from './dto/analyze-screenshot.dto';
import { ExtractDomDto } from './dto/extract-dom.dto';

@Controller('vision')
export class VisionController {
  private readonly logger = new Logger(VisionController.name);

  constructor(
    private visionService: VisionService,
    private prisma: PrismaService,
  ) {}

  @Post('analyze')
  async analyzeScreenshot(
    @CurrentUser() user: any,
    @Body() dto: AnalyzeScreenshotDto,
  ) {
    this.logger.log(
      `📸 Analyzing screenshot from ${dto.platform} for user ${user.id}`,
    );

    // Récupérer les interactions extraites par Claude Vision
    const interactions = await this.visionService.analyzeScreenshot(
      dto.screenshot,
      dto.platform,
    );

    if (interactions.length === 0) {
      return {
        success: true,
        totalAnalyzed: 0,
        newInteractions: 0,
        message: 'No interactions found in screenshot',
      };
    }

    // Trouver le workspace de l'utilisateur
    const workspaceMember = await this.prisma.workspaceMember.findFirst({
      where: {
        userId: user.id,
      },
      include: {
        workspace: true,
      },
    });

    if (!workspaceMember) {
      return {
        success: false,
        error: 'No workspace found for user',
      };
    }

    // Trouver le compte social actif pour cette plateforme
    const socialAccount = await this.prisma.socialAccount.findFirst({
      where: {
        workspaceId: workspaceMember.workspaceId,
        platform: dto.platform.toUpperCase(),
        isActive: true,
      },
    });

    if (!socialAccount) {
      return {
        success: false,
        error: `No active ${dto.platform} account found for this workspace`,
      };
    }

    // Sauvegarder les nouvelles interactions
    let newCount = 0;
    const oneHourAgo = new Date(Date.now() - 3600000);

    for (const interaction of interactions) {
      // Vérifier si l'interaction existe déjà (même username, type, dans la dernière heure)
      const exists = await this.prisma.interactionEvent.findFirst({
        where: {
          workspaceId: workspaceMember.workspaceId,
          socialAccountId: socialAccount.id,
          actorUsername: interaction.username,
          type: interaction.type.toUpperCase(),
          createdAt: {
            gte: oneHourAgo,
          },
        },
      });

      if (!exists) {
        // Créer ou trouver le Target
        let target = await this.prisma.target.findFirst({
          where: {
            workspaceId: workspaceMember.workspaceId,
            platform: dto.platform.toUpperCase(),
            username: interaction.username,
          },
        });

        if (!target) {
          target = await this.prisma.target.create({
            data: {
              workspaceId: workspaceMember.workspaceId,
              socialAccountId: socialAccount.id,
              platform: dto.platform.toUpperCase(),
              platformUserId: interaction.username, // Utiliser username comme ID temporaire
              username: interaction.username,
              name: interaction.displayName,
            },
          });
        }

        // Créer l'interaction
        await this.prisma.interactionEvent.create({
          data: {
            workspaceId: workspaceMember.workspaceId,
            socialAccountId: socialAccount.id,
            platform: dto.platform.toUpperCase(),
            type: interaction.type.toUpperCase(),
            actorId: interaction.username,
            actorUsername: interaction.username,
            actorName: interaction.displayName,
            message: interaction.content,
            targetId: target.id,
            rawData: {
              timestamp: interaction.timestamp,
              capturedVia: 'extension',
              url: dto.url,
            },
          },
        });
        newCount++;
      }
    }

    this.logger.log(
      `✅ Saved ${newCount} new interactions out of ${interactions.length} analyzed`,
    );

    return {
      success: true,
      totalAnalyzed: interactions.length,
      newInteractions: newCount,
    };
  }

  @Post('extract-dom')
  @UseGuards(JwtAuthGuard)
  async extractDom(
    @CurrentUser() user: any,
    @Body() dto: ExtractDomDto,
  ) {
    this.logger.log(
      `📊 Extracting ${dto.interactions.length} interactions from DOM for ${dto.platform} (user ${user.id})`,
    );

    // Trouver le workspace de l'utilisateur
    const workspaceMember = await this.prisma.workspaceMember.findFirst({
      where: {
        userId: user.id,
      },
      include: {
        workspace: true,
      },
    });

    if (!workspaceMember) {
      return {
        success: false,
        error: 'No workspace found for user',
      };
    }

    // Trouver le compte social actif pour cette plateforme
    const socialAccount = await this.prisma.socialAccount.findFirst({
      where: {
        workspaceId: workspaceMember.workspaceId,
        platform: dto.platform.toUpperCase(),
        isActive: true,
      },
    });

    if (!socialAccount) {
      return {
        success: false,
        error: `No active ${dto.platform} account found for this workspace`,
      };
    }

    // Sauvegarder les nouvelles interactions
    let newCount = 0;
    const oneHourAgo = new Date(Date.now() - 3600000);

    for (const interaction of dto.interactions) {
      // Vérifier si l'interaction existe déjà
      const exists = await this.prisma.interactionEvent.findFirst({
        where: {
          workspaceId: workspaceMember.workspaceId,
          socialAccountId: socialAccount.id,
          actorUsername: interaction.username,
          type: interaction.type.toUpperCase(),
          createdAt: {
            gte: oneHourAgo,
          },
        },
      });

      if (!exists) {
        // Créer ou trouver le Target
        let target = await this.prisma.target.findFirst({
          where: {
            workspaceId: workspaceMember.workspaceId,
            platform: dto.platform.toUpperCase(),
            username: interaction.username,
          },
        });

        if (!target) {
          target = await this.prisma.target.create({
            data: {
              workspaceId: workspaceMember.workspaceId,
              socialAccountId: socialAccount.id,
              platform: dto.platform.toUpperCase(),
              platformUserId: interaction.username,
              username: interaction.username,
              name: interaction.displayName,
            },
          });
        }

        // Créer l'interaction
        await this.prisma.interactionEvent.create({
          data: {
            workspaceId: workspaceMember.workspaceId,
            socialAccountId: socialAccount.id,
            platform: dto.platform.toUpperCase(),
            type: interaction.type.toUpperCase(),
            actorId: interaction.username,
            actorUsername: interaction.username,
            actorName: interaction.displayName,
            message: interaction.content,
            targetId: target.id,
            rawData: {
              timestamp: interaction.timestamp,
              extractedVia: 'dom',
              url: dto.url,
              extractedAt: dto.extractedAt,
            },
          },
        });
        newCount++;
      }
    }

    this.logger.log(
      `✅ Saved ${newCount} new interactions out of ${dto.interactions.length} extracted`,
    );

    return {
      success: true,
      totalExtracted: dto.interactions.length,
      newInteractions: newCount,
    };
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      timestamp: new Date().toISOString(),
    };
  }
}

