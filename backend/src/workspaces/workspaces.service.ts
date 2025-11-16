import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateWorkspaceDto) {
    const slug = this.generateSlug(dto.name);
    
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
}

