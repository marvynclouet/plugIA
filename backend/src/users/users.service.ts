import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async deleteUser(userId: string) {
    console.log('🗑️ Deleting user and all associated data:', { userId });

    // Supprimer toutes les données associées à l'utilisateur
    // Prisma gère automatiquement les cascades pour les relations
    // Mais on doit supprimer manuellement les workspaces et leurs données

    // 1. Récupérer tous les workspaces de l'utilisateur
    const workspaces = await this.prisma.workspace.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            members: {
              some: { userId },
            },
          },
        ],
      },
    });

    // 2. Supprimer tous les workspaces (cascade supprime automatiquement les données associées)
    for (const workspace of workspaces) {
      await this.prisma.workspace.delete({
        where: { id: workspace.id },
      });
    }

    // 3. Supprimer l'utilisateur
    await this.prisma.user.delete({
      where: { id: userId },
    });

    console.log('✅ User and all data deleted:', { userId });

    return { message: 'User and all associated data deleted successfully' };
  }

  async deleteUserByEmail(email: string) {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    return this.deleteUser(user.id);
  }
}

