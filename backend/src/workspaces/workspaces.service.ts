import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateWorkspaceDto) {
    const baseSlug = this.generateSlug(dto.name);
    const slug = await this.generateUniqueSlug(baseSlug);
    
    return this.prisma.workspace.create({
      data: {
        name: dto.name,
        slug,
        ownerId: dto.ownerId,
        members: {
          create: {
            userId: dto.ownerId,
            role: 'owner',
          },
        },
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            socialAccounts: true,
            leads: true,
          },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id,
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            socialAccounts: true,
            leads: true,
            interactions: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new Error('Workspace not found or access denied');
    }

    return workspace;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    
    // Vérifier si le slug existe déjà
    while (true) {
      const existing = await this.prisma.workspace.findUnique({
        where: { slug },
      });
      
      if (!existing) {
        return slug;
      }
      
      // Si le slug existe, ajouter un suffixe numérique
      slug = `${baseSlug}-${counter}`;
      counter++;
      
      // Sécurité : éviter une boucle infinie
      if (counter > 1000) {
        // Si on arrive à 1000, utiliser un timestamp
        slug = `${baseSlug}-${Date.now()}`;
        break;
      }
    }
    
    return slug;
  }
}

