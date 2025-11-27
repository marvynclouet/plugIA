// backend/src/social-accounts/providers/tiktok-inbox.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Browser, BrowserContext, Page, Cookie } from 'playwright';
import { TikTokBrowserService } from './tiktok-browser.service';
import { TikTokSessionManagerService } from './tiktok-session-manager.service';

export interface InboxInteraction {
  id?: string;
  username: string;
  type: 'like' | 'comment' | 'follow' | 'dm' | 'share' | 'mention';
  content?: string; // Pour les commentaires et DM
  timestamp: Date;
  profileUrl?: string;
  videoUrl?: string; // Si c'est lié à une vidéo
  isNew: boolean;
}

@Injectable()
export class TikTokInboxService {
  private readonly logger = new Logger(TikTokInboxService.name);

  constructor(
    private tiktokBrowserService: TikTokBrowserService,
    private sessionManager: TikTokSessionManagerService,
  ) {}

  /**
   * Scrape la page Inbox TikTok pour récupérer toutes les interactions
   * 
   * Flow :
   * 1. Charge le context Playwright avec storageState (session persistante)
   * 2. Va sur https://www.tiktok.com/inbox
   * 3. Attend que la liste charge
   * 4. Scrape tous les items (likes, comments, follows, DM)
   * 5. Retourne les interactions normalisées
   */
  async scrapeInbox(
    accountId: string,
    cookies?: string[],
  ): Promise<InboxInteraction[]> {
    this.logger.log(`📬 [INBOX] Scraping Inbox pour account: ${accountId}`);

    let browser: Browser | null = null;
    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
      // Essayer d'utiliser la session persistante d'abord
      try {
        const session = await this.sessionManager.getActiveSession(accountId);
        if (session) {
          browser = session.browser;
          context = session.context;
          page = await context.newPage();
        }
      } catch (e) {
        this.logger.warn(`⚠️ [INBOX] Session persistante non disponible, utilisation des cookies`);
      }

      // Si pas de session persistante, créer un context depuis cookies
      if (!page && cookies) {
        const { browser: b, page: p } = await this.tiktokBrowserService.createContextFromCookies(cookies);
        browser = b;
        page = p;
      }

      if (!page) {
        throw new Error('Impossible de créer un context Playwright');
      }

      // Vérifier que la session est valide
      if (page) {
        const isValid = await this.tiktokBrowserService.validateSession(page);
        if (!isValid) {
          throw new Error('Session TikTok expirée. Reconnexion nécessaire.');
        }
      }

      // Aller sur la page Inbox
      this.logger.log(`🌐 [INBOX] Navigation vers /inbox...`);
      await page.goto('https://www.tiktok.com/inbox', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Attendre que la page charge
      await this.humanDelay(2000, 3000);

      // Scroller progressivement pour charger tous les items
      await this.humanScroll(page);

      // Attendre que les items apparaissent
      await page.waitForTimeout(2000);

      // Scraper les interactions
      const interactions = await this.extractInteractions(page);

      this.logger.log(`✅ [INBOX] ${interactions.length} interactions trouvées`);

      return interactions;
    } catch (error) {
      this.logger.error(`❌ [INBOX] Erreur lors du scraping: ${error.message}`);
      
      // Si c'est une erreur de session expirée, la propager
      if (error.message.includes('expirée') || error.message.includes('login')) {
        throw new Error('SESSION_EXPIRED');
      }
      
      throw error;
    } finally {
      // Ne pas fermer le browser si c'est une session persistante
      if (browser && !(await this.sessionManager.hasActiveSession(accountId))) {
        await browser.close();
      }
    }
  }

  /**
   * Extrait toutes les interactions de la page Inbox
   */
  private async extractInteractions(page: Page): Promise<InboxInteraction[]> {
    const interactions: InboxInteraction[] = [];

    try {
      // Sélecteurs possibles pour les items Inbox
      // TikTok peut utiliser différents sélecteurs selon la version
      const itemSelectors = [
        '[data-e2e="inbox-item"]',
        '.inbox-item',
        '[class*="inbox"]',
        '[class*="notification"]',
        'div[role="listitem"]',
      ];

      let items: any[] = [];
      for (const selector of itemSelectors) {
        try {
          items = await page.$$(selector);
          if (items.length > 0) {
            this.logger.log(`✅ [INBOX] ${items.length} items trouvés avec: ${selector}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      // Si aucun item trouvé, essayer de trouver tous les éléments cliquables
      if (items.length === 0) {
        items = await page.$$('div[role="button"], a[href*="/@"]');
        this.logger.log(`🔍 [INBOX] ${items.length} éléments potentiels trouvés`);
      }

      // Extraire les données de chaque item
      for (let i = 0; i < items.length; i++) {
        try {
          const item = items[i];
          const interaction = await this.extractInteractionFromItem(item, page);
          if (interaction) {
            interactions.push(interaction);
          }
        } catch (e) {
          this.logger.warn(`⚠️ [INBOX] Erreur lors de l'extraction de l'item ${i}: ${e.message}`);
          continue;
        }
      }
    } catch (error) {
      this.logger.error(`❌ [INBOX] Erreur lors de l'extraction: ${error.message}`);
    }

    return interactions;
  }

  /**
   * Extrait les données d'une interaction depuis un élément DOM
   */
  private async extractInteractionFromItem(
    item: any,
    page: Page,
  ): Promise<InboxInteraction | null> {
    try {
      // Essayer d'extraire le username
      const usernameElement = await item.$('a[href*="/@"]');
      let username = 'unknown';
      if (usernameElement) {
        const href = await usernameElement.getAttribute('href');
        if (href) {
          const match = href.match(/@([^/?]+)/);
          if (match) {
            username = decodeURIComponent(match[1]);
          }
        }
      }

      // Essayer d'extraire le type d'interaction
      const text = await item.textContent();
      let type: InboxInteraction['type'] = 'dm';
      
      if (text) {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('liked') || lowerText.includes('a aimé')) {
          type = 'like';
        } else if (lowerText.includes('commented') || lowerText.includes('commenté')) {
          type = 'comment';
        } else if (lowerText.includes('followed') || lowerText.includes('suivi')) {
          type = 'follow';
        } else if (lowerText.includes('shared') || lowerText.includes('partagé')) {
          type = 'share';
        } else if (lowerText.includes('mentioned') || lowerText.includes('mentionné')) {
          type = 'mention';
        }
      }

      // Essayer d'extraire le contenu (pour commentaires et DM)
      let content: string | undefined;
      const contentElement = await item.$('[class*="text"], [class*="content"], p, span');
      if (contentElement) {
        content = await contentElement.textContent() || undefined;
      }

      // Essayer d'extraire le timestamp
      const timeElement = await item.$('[class*="time"], [class*="date"], time');
      let timestamp = new Date();
      if (timeElement) {
        const timeText = await timeElement.textContent();
        if (timeText) {
          timestamp = this.parseTimeText(timeText);
        }
      }

      // Essayer d'extraire l'URL du profil
      const profileUrl = username !== 'unknown' ? `https://www.tiktok.com/@${username}` : undefined;

      return {
        username,
        type,
        content,
        timestamp,
        profileUrl,
        isNew: true, // Par défaut, on considère que c'est nouveau
      };
    } catch (error) {
      this.logger.warn(`⚠️ [INBOX] Erreur lors de l'extraction d'un item: ${error.message}`);
      return null;
    }
  }

  /**
   * Parse un texte de temps relatif (ex: "2h ago", "il y a 5 min") en Date
   */
  private parseTimeText(timeText: string): Date {
    const now = new Date();
    const lower = timeText.toLowerCase();

    // "2h ago", "il y a 2h"
    const hourMatch = lower.match(/(\d+)\s*h/);
    if (hourMatch) {
      const hours = parseInt(hourMatch[1]);
      return new Date(now.getTime() - hours * 60 * 60 * 1000);
    }

    // "5m ago", "il y a 5 min"
    const minMatch = lower.match(/(\d+)\s*m/);
    if (minMatch) {
      const mins = parseInt(minMatch[1]);
      return new Date(now.getTime() - mins * 60 * 1000);
    }

    // "1d ago", "il y a 1 jour"
    const dayMatch = lower.match(/(\d+)\s*d/);
    if (dayMatch) {
      const days = parseInt(dayMatch[1]);
      return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }

    return now;
  }

  /**
   * Scroll progressif comme un humain
   */
  private async humanScroll(page: Page): Promise<void> {
    const viewport = page.viewportSize();
    if (!viewport) return;

    // Scroller plusieurs fois pour charger tous les items
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, 500);
      });
      await this.humanDelay(800, 1500);
    }

    // Scroller en haut
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await this.humanDelay(1000, 2000);
  }

  /**
   * Délai aléatoire pour simuler le comportement humain
   */
  private async humanDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Ouvre une conversation DM avec un utilisateur
   */
  async openConversation(
    accountId: string,
    username: string,
    cookies?: string[],
  ): Promise<{ success: boolean; page?: Page }> {
    this.logger.log(`💬 [INBOX] Ouverture conversation avec @${username}`);

    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      // Utiliser session persistante ou cookies
      try {
        const session = await this.sessionManager.getActiveSession(accountId);
        if (session) {
          page = await session.context.newPage();
        }
      } catch (e) {
        // Fallback sur cookies
      }

      if (!page && cookies) {
        const { browser: b, page: p } = await this.tiktokBrowserService.createContextFromCookies(cookies);
        browser = b;
        page = p;
      }

      if (!page) {
        throw new Error('Impossible de créer un context Playwright');
      }

      // Aller sur le profil
      await page.goto(`https://www.tiktok.com/@${username}`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      await this.humanDelay(2000, 3000);

      // Chercher et cliquer sur le bouton Message
      const messageButtonSelectors = [
        'button:has-text("Message")',
        'button:has-text("message")',
        '[data-e2e="message-button"]',
        'a[href*="/messages"]',
      ];

      let clicked = false;
      for (const selector of messageButtonSelectors) {
        try {
          const button = await page.$(selector);
          if (button) {
            const isVisible = await button.isVisible();
            if (isVisible) {
              await this.humanClick(page, button);
              await this.humanDelay(2000, 3000);
              clicked = true;
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }

      if (!clicked) {
        throw new Error('Bouton Message non trouvé');
      }

      // Attendre que la conversation s'ouvre
      await page.waitForTimeout(2000);

      return { success: true, page };
    } catch (error) {
      this.logger.error(`❌ [INBOX] Erreur lors de l'ouverture de la conversation: ${error.message}`);
      if (browser) {
        await browser.close();
      }
      return { success: false };
    }
  }

  /**
   * Clic humain avec mouvement de souris
   */
  private async humanClick(page: Page, element: any): Promise<void> {
    const box = await element.boundingBox();
    if (box) {
      // Mouvement de souris vers l'élément
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
        steps: 10,
      });
      await this.humanDelay(200, 500);
      await element.click();
    } else {
      await element.click();
    }
  }
}

