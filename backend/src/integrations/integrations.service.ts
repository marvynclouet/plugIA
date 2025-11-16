import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { google } from 'googleapis';
import axios from 'axios';

@Injectable()
export class IntegrationsService {
  constructor(private prisma: PrismaService) {}

  async create(workspaceId: string, type: string, config: any) {
    return this.prisma.integration.create({
      data: {
        workspaceId,
        type,
        name: config.name || type,
        config,
        isActive: true,
        autoSync: config.autoSync || false,
      },
    });
  }

  async findAll(workspaceId: string) {
    return this.prisma.integration.findMany({
      where: { workspaceId, isActive: true },
    });
  }

  async syncLead(leadId: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { workspace: true },
    });

    if (!lead) {
      return;
    }

    // Récupérer les intégrations actives avec auto-sync
    const integrations = await this.prisma.integration.findMany({
      where: {
        workspaceId: lead.workspaceId,
        isActive: true,
        autoSync: true,
      },
    });

    for (const integration of integrations) {
      try {
        switch (integration.type) {
          case 'google_sheets':
            await this.syncToGoogleSheets(lead, integration);
            break;
          case 'notion':
            await this.syncToNotion(lead, integration);
            break;
          case 'webhook':
            await this.syncToWebhook(lead, integration);
            break;
        }

        // Logger le succès
        await this.prisma.exportLog.create({
          data: {
            workspaceId: lead.workspaceId,
            integrationId: integration.id,
            leadId: lead.id,
            type: integration.type,
            status: 'success',
          },
        });
      } catch (error) {
        // Logger l'erreur
        await this.prisma.exportLog.create({
          data: {
            workspaceId: lead.workspaceId,
            integrationId: integration.id,
            leadId: lead.id,
            type: integration.type,
            status: 'failed',
            errorMessage: error.message,
          },
        });
      }
    }
  }

  private async syncToGoogleSheets(lead: any, integration: any) {
    const { spreadsheetId, sheetName, credentials } = integration.config;

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(credentials),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Ajouter une ligne
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          [
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
          ],
        ],
      },
    });
  }

  private async syncToNotion(lead: any, integration: any) {
    const { databaseId, token } = integration.config;

    await axios.post(
      'https://api.notion.com/v1/pages',
      {
        parent: { database_id: databaseId },
        properties: {
          Name: {
            title: [
              {
                text: {
                  content: lead.name || lead.username,
                },
              },
            ],
          },
          Username: {
            rich_text: [
              {
                text: {
                  content: lead.username,
                },
              },
            ],
          },
          Phone: {
            phone_number: lead.phone || null,
          },
          Platform: {
            select: {
              name: lead.platform,
            },
          },
          Status: {
            select: {
              name: lead.status,
            },
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
      },
    );
  }

  private async syncToWebhook(lead: any, integration: any) {
    const { url, headers } = integration.config;

    await axios.post(
      url,
      {
        id: lead.id,
        username: lead.username,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        platform: lead.platform,
        source: lead.source,
        status: lead.status,
        interestScore: lead.interestScore,
        createdAt: lead.createdAt,
      },
      {
        headers: headers || {},
      },
    );
  }
}

