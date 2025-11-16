import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InstagramService } from './providers/instagram.service';
import * as crypto from 'crypto';

@Injectable()
export class SocialAccountsService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key = Buffer.from(
    process.env.ENCRYPTION_KEY || 'default-key-32-chars-long!!',
    'utf-8',
  ).slice(0, 32);

  constructor(
    private prisma: PrismaService,
    private instagramService: InstagramService,
  ) {}

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  private decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async create(workspaceId: string, platform: string, data: any) {
    const encryptedAccessToken = this.encrypt(data.accessToken);
    const encryptedRefreshToken = data.refreshToken
      ? this.encrypt(data.refreshToken)
      : null;

    return this.prisma.socialAccount.create({
      data: {
        workspaceId,
        platform,
        platformUserId: data.platformUserId,
        platformUsername: data.platformUsername,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: data.tokenExpiresAt,
        scopes: data.scopes || [],
      },
    });
  }

  async findAll(workspaceId: string) {
    const accounts = await this.prisma.socialAccount.findMany({
      where: { workspaceId, isActive: true },
      select: {
        id: true,
        platform: true,
        platformUserId: true,
        platformUsername: true,
        scopes: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return accounts;
  }

  async findOne(id: string, workspaceId: string) {
    const account = await this.prisma.socialAccount.findFirst({
      where: { id, workspaceId },
    });

    if (!account) {
      throw new Error('Social account not found');
    }

    return {
      ...account,
      accessToken: this.decrypt(account.accessToken),
      refreshToken: account.refreshToken
        ? this.decrypt(account.refreshToken)
        : null,
    };
  }

  async getDecryptedToken(accountId: string): Promise<string> {
    const account = await this.prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    return this.decrypt(account.accessToken);
  }

  async getInstagramAuthUrl(workspaceId: string) {
    return this.instagramService.getAuthUrl(workspaceId);
  }

  async handleInstagramCallback(code: string, workspaceId: string) {
    const tokens = await this.instagramService.exchangeCode(code);
    const userInfo = await this.instagramService.getUserInfo(
      tokens.access_token,
    );

    return this.create(workspaceId, 'instagram', {
      platformUserId: userInfo.id,
      platformUsername: userInfo.username,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null,
      scopes: ['instagram_basic', 'instagram_manage_messages', 'pages_read_engagement'],
    });
  }
}

