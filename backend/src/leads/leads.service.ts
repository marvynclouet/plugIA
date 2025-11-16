import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationsService } from '../integrations/integrations.service';
import OpenAI from 'openai';

@Injectable()
export class LeadsService {
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private integrationsService: IntegrationsService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async extractPhoneNumber(text: string): Promise<string | null> {
    // Regex pour détecter les numéros français
    const phoneRegex = /(\+33|0)[1-9](\d{2}){4}/g;
    const matches = text.match(phoneRegex);

    if (matches && matches.length > 0) {
      // Normaliser le format
      let phone = matches[0].replace(/\s/g, '');
      if (phone.startsWith('+33')) {
        phone = phone.replace('+33', '0');
      }
      return phone;
    }

    // Si pas de match regex, essayer avec l'IA
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Extrait le numéro de téléphone français du texte suivant. Réponds uniquement avec le numéro au format 0X XX XX XX XX ou null si aucun numéro trouvé.',
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0,
      });

      const extracted = completion.choices[0].message.content?.trim();
      if (extracted && extracted !== 'null' && phoneRegex.test(extracted)) {
        return extracted.replace(/\s/g, '');
      }
    } catch (error) {
      console.error('Error extracting phone with AI:', error);
    }

    return null;
  }

  async createFromDm(workspaceId: string, targetId: string, phone?: string) {
    const target = await this.prisma.target.findUnique({
      where: { id: targetId },
    });

    if (!target) {
      throw new Error('Target not found');
    }

    // Vérifier si un lead existe déjà
    const existing = await this.prisma.lead.findFirst({
      where: {
        workspaceId,
        platform: target.platform,
        platformUserId: target.platformUserId,
      },
    });

    if (existing) {
      // Mettre à jour le lead existant
      return this.prisma.lead.update({
        where: { id: existing.id },
        data: {
          phone: phone || existing.phone,
          status: phone ? 'contacted' : existing.status,
        },
      });
    }

    const lead = await this.prisma.lead.create({
      data: {
        workspaceId,
        targetId,
        platform: target.platform,
        platformUserId: target.platformUserId,
        username: target.username,
        name: target.name,
        phone,
        source: 'dm',
        interestScore: target.interestScore,
        status: phone ? 'contacted' : 'new',
      },
    });

    // Créer un événement
    await this.prisma.leadEvent.create({
      data: {
        leadId: lead.id,
        type: 'created',
        description: 'Lead créé depuis DM',
      },
    });

    // Auto-sync si configuré
    await this.integrationsService.syncLead(lead.id);

    return lead;
  }

  async updateFromMessage(sequenceId: string, message: string) {
    const sequence = await this.prisma.dmSequence.findUnique({
      where: { id: sequenceId },
      include: { target: true },
    });

    if (!sequence) {
      return;
    }

    // Extraire le numéro de téléphone
    const phone = await this.extractPhoneNumber(message);

    if (phone) {
      // Créer ou mettre à jour le lead
      await this.createFromDm(
        sequence.workspaceId,
        sequence.targetId,
        phone,
      );

      // Mettre à jour la séquence
      await this.prisma.dmSequence.update({
        where: { id: sequenceId },
        data: {
          status: 'completed',
        },
      });
    }

    // Enregistrer le message reçu
    await this.prisma.dmMessage.create({
      data: {
        sequenceId,
        direction: 'received',
        content: message,
      },
    });
  }

  async findAll(workspaceId: string, filters?: any) {
    const where: any = { workspaceId };

    if (filters?.platform) {
      where.platform = filters.platform;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { username: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
      ];
    }

    return this.prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
      skip: filters?.offset || 0,
      include: {
        target: {
          select: {
            interestScore: true,
            lastInteractionAt: true,
          },
        },
        _count: {
          select: {
            events: true,
          },
        },
      },
    });
  }

  async findOne(id: string, workspaceId: string) {
    return this.prisma.lead.findFirst({
      where: { id, workspaceId },
      include: {
        target: true,
        events: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
  }

  async updateStatus(id: string, workspaceId: string, status: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, workspaceId },
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      data: { status },
    });

    await this.prisma.leadEvent.create({
      data: {
        leadId: id,
        type: 'status_changed',
        description: `Status changé: ${lead.status} → ${status}`,
      },
    });

    return updated;
  }

  async exportToCsv(workspaceId: string) {
    const leads = await this.findAll(workspaceId, { limit: 10000 });

    const headers = [
      'ID',
      'Username',
      'Name',
      'Phone',
      'Email',
      'Platform',
      'Source',
      'Status',
      'Interest Score',
      'Created At',
    ];

    const rows = leads.map((lead) => [
      lead.id,
      lead.username,
      lead.name || '',
      lead.phone || '',
      lead.email || '',
      lead.platform,
      lead.source,
      lead.status,
      lead.interestScore?.toString() || '0',
      lead.createdAt.toISOString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }
}

