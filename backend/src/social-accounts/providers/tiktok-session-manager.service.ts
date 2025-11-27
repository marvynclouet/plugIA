// backend/src/social-accounts/providers/tiktok-session-manager.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { chromium } from 'playwright-extra';
import { Browser, BrowserContext, Page, Cookie } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { parseCookiesForPlaywright } from '../../utils/cookie-parser';

// Utiliser le plugin stealth pour éviter la détection
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(StealthPlugin());

interface PersistentSession {
  accountId: string;
  browser: Browser;
  context: BrowserContext;
  page: Page;
  lastUsed: Date;
  cookies: Cookie[];
  localStorage: Record<string, string>;
}

@Injectable()
export class TikTokSessionManagerService {
  private readonly logger = new Logger(TikTokSessionManagerService.name);
  private activeSessions: Map<string, PersistentSession> = new Map();
  private readonly sessionsDir = path.join(process.cwd(), 'sessions');

  constructor() {
    // Créer le dossier sessions s'il n'existe pas
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
    }
  }

  /**
   * Crée ou récupère une session Playwright persistante pour un compte TikTok
   */
  async getOrCreateSession(
    accountId: string,
    cookies: Cookie[] | string[] | string,
  ): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
    // Vérifier si une session existe déjà
    const existingSession = this.activeSessions.get(accountId);
    if (existingSession) {
      // Vérifier si la session est encore valide
      const isValid = await this.validateSession(existingSession.page);
      if (isValid) {
        this.logger.log(`♻️ [SESSION] Réutilisation session existante pour account: ${accountId}`);
        existingSession.lastUsed = new Date();
        return {
          browser: existingSession.browser,
          context: existingSession.context,
          page: existingSession.page,
        };
      } else {
        this.logger.warn(`⚠️ [SESSION] Session expirée pour account: ${accountId}, création nouvelle session`);
        await this.closeSession(accountId);
      }
    }

    // Créer une nouvelle session
    this.logger.log(`🆕 [SESSION] Création nouvelle session pour account: ${accountId}`);
    return this.createNewSession(accountId, cookies);
  }

  /**
   * Crée une nouvelle session Playwright avec cookies
   */
  private async createNewSession(
    accountId: string,
    cookies: Cookie[] | string[] | string,
  ): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
    const browser = await chromium.launch({
      headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });

    const userAgent =
      process.env.TIKTOK_USER_AGENT ||
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    const context = await browser.newContext({
      userAgent,
      locale: 'fr-FR',
      timezoneId: 'Europe/Paris',
      viewport: { width: 1920, height: 1080 },
      permissions: ['notifications'],
      extraHTTPHeaders: {
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });

    // Formater et injecter les cookies
    const formattedCookies = parseCookiesForPlaywright(cookies);
    if (formattedCookies.length > 0) {
      await context.addCookies(
        formattedCookies.map((c) => ({
          ...c,
          domain: c.domain || '.tiktok.com',
          path: c.path || '/',
        })),
      );
      this.logger.log(`🍪 [SESSION] ${formattedCookies.length} cookies injectés`);
    }

    const page = await context.newPage();

    // Valider la session
    await page.goto('https://www.tiktok.com/@me', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    const isValid = await this.validateSession(page);
    if (!isValid) {
      await browser.close();
      throw new Error('Session TikTok invalide - cookies expirés ou incorrects');
    }

    // Sauvegarder la session
    const session: PersistentSession = {
      accountId,
      browser,
      context,
      page,
      lastUsed: new Date(),
      cookies: formattedCookies,
      localStorage: {},
    };

    this.activeSessions.set(accountId, session);

    // Sauvegarder la session sur disque pour persistance
    await this.saveSessionToDisk(accountId, formattedCookies);

    this.logger.log(`✅ [SESSION] Session créée et sauvegardée pour account: ${accountId}`);

    return { browser, context, page };
  }

  /**
   * Valide qu'une session est toujours active
   */
  private async validateSession(page: Page): Promise<boolean> {
    try {
      const url = page.url();
      if (url.includes('/login') || url.includes('/404')) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sauvegarde une session sur disque pour persistance
   */
  private async saveSessionToDisk(accountId: string, cookies: Cookie[]): Promise<void> {
    try {
      const sessionFile = path.join(this.sessionsDir, `tiktok_${accountId}.json`);
      const sessionData = {
        accountId,
        cookies,
        savedAt: new Date().toISOString(),
      };
      fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
      this.logger.log(`💾 [SESSION] Session sauvegardée sur disque: ${sessionFile}`);
    } catch (error) {
      this.logger.warn(`⚠️ [SESSION] Erreur lors de la sauvegarde: ${error.message}`);
    }
  }

  /**
   * Charge une session depuis le disque
   */
  async loadSessionFromDisk(accountId: string): Promise<Cookie[] | null> {
    try {
      const sessionFile = path.join(this.sessionsDir, `tiktok_${accountId}.json`);
      if (!fs.existsSync(sessionFile)) {
        return null;
      }

      const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
      this.logger.log(`📂 [SESSION] Session chargée depuis disque pour account: ${accountId}`);
      return sessionData.cookies || null;
    } catch (error) {
      this.logger.warn(`⚠️ [SESSION] Erreur lors du chargement: ${error.message}`);
      return null;
    }
  }

  /**
   * Ferme une session et nettoie les ressources
   */
  async closeSession(accountId: string): Promise<void> {
    const session = this.activeSessions.get(accountId);
    if (session) {
      await session.browser.close();
      this.activeSessions.delete(accountId);
      this.logger.log(`🧹 [SESSION] Session fermée pour account: ${accountId}`);
    }
  }

  /**
   * Nettoie les sessions inactives (plus de 1 heure)
   */
  async cleanupInactiveSessions(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [accountId, session] of this.activeSessions.entries()) {
      if (session.lastUsed < oneHourAgo) {
        await this.closeSession(accountId);
      }
    }
  }

  /**
   * Récupère une session active si elle existe
   */
  async getActiveSession(accountId: string): Promise<PersistentSession | null> {
    const session = this.activeSessions.get(accountId);
    if (session) {
      // Vérifier si la session est encore valide
      const isValid = await this.validateSession(session.page);
      if (isValid) {
        return session;
      } else {
        // Session expirée, la supprimer
        await this.closeSession(accountId);
        return null;
      }
    }
    return null;
  }

  /**
   * Vérifie si une session active existe
   */
  async hasActiveSession(accountId: string): Promise<boolean> {
    const session = await this.getActiveSession(accountId);
    return session !== null;
  }
}

