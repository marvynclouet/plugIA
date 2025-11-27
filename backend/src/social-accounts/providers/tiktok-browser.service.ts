// backend/src/social-accounts/providers/tiktok-browser.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { chromium } from 'playwright-extra';
import { Browser, BrowserContext, Page, Cookie } from 'playwright';
import { parseCookiesForPlaywright } from '../../utils/cookie-parser';

// Utiliser le plugin stealth pour éviter la détection
// Import en CommonJS car le plugin n'a pas de export default propre
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(StealthPlugin());

@Injectable()
export class TikTokBrowserService {
  private readonly logger = new Logger(TikTokBrowserService.name);

  /**
   * 🔥 CRITIQUE : Formate correctement les cookies avec domain et path
   * Utilise le parser intelligent pour gérer tous les formats (brut, tabulaire, standard)
   */
  private formatCookies(cookies: Cookie[] | string[] | string): Cookie[] {
    if (!cookies || (Array.isArray(cookies) && cookies.length === 0)) {
      return [];
    }

    // Utiliser le parser intelligent qui gère tous les formats
    const parsedCookies = parseCookiesForPlaywright(cookies);
    
    // S'assurer que tous les cookies ont domain et path
    return parsedCookies.map((cookie) => ({
      ...cookie,
      domain: cookie.domain || '.tiktok.com',
      path: cookie.path || '/',
      expires: cookie.expires || -1,
      value: cookie.value ? decodeURIComponent(cookie.value) : cookie.value,
    }));
  }

  /**
   * 🔥 CRITIQUE : Valide que la session est active AVANT toute action
   * Public pour être utilisé par d'autres services
   */
  async validateSession(page: Page): Promise<boolean> {
    try {
      const currentUrl = page.url();
      this.logger.log(`🔍 [VALIDATE] URL actuelle: ${currentUrl}`);

      // Vérifier si on est redirigé vers login ou 404
      if (currentUrl.includes('/login') || currentUrl.includes('/404')) {
        this.logger.error(`❌ [VALIDATE] Session invalide - Redirigé vers: ${currentUrl}`);
        
        // Screenshot de debug
        if (process.env.PLAYWRIGHT_DEBUG === 'true') {
          await page.screenshot({ path: 'debug-session-invalid.png', fullPage: true });
          this.logger.log('📸 [VALIDATE] Screenshot sauvegardé: debug-session-invalid.png');
        }
        
        return false;
      }

      // Vérifier qu'on est bien sur une page TikTok valide (pas 404)
      if (!currentUrl.includes('tiktok.com') || currentUrl.includes('404')) {
        this.logger.error(`❌ [VALIDATE] URL invalide: ${currentUrl}`);
        return false;
      }

      // Vérifier qu'on n'est pas sur une page publique (on doit être sur @me ou feed)
      if (currentUrl.includes('/@me') || currentUrl.includes('/foryou') || currentUrl.includes('/following')) {
        this.logger.log(`✅ [VALIDATE] Session valide - Page: ${currentUrl}`);
        return true;
      }

      // Si on est sur une autre page TikTok, c'est OK aussi
      this.logger.log(`✅ [VALIDATE] Session valide - Page TikTok: ${currentUrl}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ [VALIDATE] Erreur lors de la validation: ${error.message}`);
      return false;
    }
  }

  /**
   * Crée un contexte Playwright avec cookies et validation de session
   * Public pour être utilisé par d'autres services
   */
  async createContextFromCookies(cookies: Cookie[] | string[] | string) {
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
      // Ajouter des permissions pour éviter les popups
      permissions: ['notifications'],
      // Simuler un vrai navigateur
      extraHTTPHeaders: {
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });

    // 🔥 CRITIQUE : Formater correctement les cookies
    const formattedCookies = this.formatCookies(cookies);
    
    if (formattedCookies.length > 0) {
      this.logger.log(`🍪 [COOKIES] Injection de ${formattedCookies.length} cookies formatés`);
      
      // Vérifier que tous les cookies ont domain et path
      const invalidCookies = formattedCookies.filter(c => !c.domain || !c.path);
      if (invalidCookies.length > 0) {
        this.logger.error(`❌ [COOKIES] ${invalidCookies.length} cookies invalides (sans domain/path)`);
      }

      await context.addCookies(formattedCookies);
      this.logger.log(`✅ [COOKIES] Cookies injectés avec domain: .tiktok.com, path: /`);
    } else {
      this.logger.warn('⚠️ [COOKIES] Aucun cookie à injecter');
    }

    const page = await context.newPage();

    // 🔥 CRITIQUE : Aller sur @me et valider la session
    this.logger.log('🔍 [SESSION] Vérification de la session TikTok...');
    await page.goto('https://www.tiktok.com/@me', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Attendre un peu pour que la page se charge
    await page.waitForTimeout(3000);

    // 🔥 CRITIQUE : Valider la session
    const isValid = await this.validateSession(page);
    
    if (!isValid) {
      const finalUrl = page.url();
      this.logger.error(`❌ [SESSION] Session invalide - URL finale: ${finalUrl}`);
      
      // Screenshot de debug
      if (process.env.PLAYWRIGHT_DEBUG === 'true') {
        await page.screenshot({ path: 'debug-session-failed.png', fullPage: true });
        this.logger.log('📸 [SESSION] Screenshot sauvegardé: debug-session-failed.png');
      }
      
      await browser.close();
      throw new Error(`TikTok session not logged in - URL: ${finalUrl}`);
    }

    this.logger.log('✅ [SESSION] Session TikTok valide - Bot connecté');
    
    return { browser, context, page };
  }

  /**
   * Récupère les statistiques du compte TikTok (followers, following, likes, etc.)
   */
  async getAccountStats(cookies: Cookie[] | string[] | string): Promise<{
    followers: string;
    following: string;
    likes: string;
    videos: string;
    bio: string;
    verified: boolean;
  }> {
    this.logger.log('📊 [STATS] Récupération des statistiques du compte TikTok...');
    const { browser, page } = await this.createContextFromCookies(cookies);

    try {
      await page.waitForTimeout(3000);

      const stats = {
        followers: 'N/A',
        following: 'N/A',
        likes: 'N/A',
        videos: 'N/A',
        bio: 'N/A',
        verified: false,
      };

      // Essayer de récupérer les stats depuis le DOM
      // Sélecteurs à adapter selon le DOM réel de TikTok
      try {
        // Followers
        const followersSelector = '[data-e2e="followers-count"]';
        const followersEl = await page.$(followersSelector);
        if (followersEl) {
          stats.followers = (await followersEl.textContent())?.trim() || 'N/A';
        }

        // Following
        const followingSelector = '[data-e2e="following-count"]';
        const followingEl = await page.$(followingSelector);
        if (followingEl) {
          stats.following = (await followingEl.textContent())?.trim() || 'N/A';
        }

        // Likes
        const likesSelector = '[data-e2e="likes-count"]';
        const likesEl = await page.$(likesSelector);
        if (likesEl) {
          stats.likes = (await likesEl.textContent())?.trim() || 'N/A';
        }

        // Videos
        const videosSelector = '[data-e2e="videos-count"]';
        const videosEl = await page.$(videosSelector);
        if (videosEl) {
          stats.videos = (await videosEl.textContent())?.trim() || 'N/A';
        }

        // Bio
        const bioSelector = '[data-e2e="user-bio"]';
        const bioEl = await page.$(bioSelector);
        if (bioEl) {
          stats.bio = (await bioEl.textContent())?.trim() || 'N/A';
        }

        // Verified
        const verifiedSelector = '[data-e2e="verified-icon"]';
        stats.verified = (await page.$(verifiedSelector)) !== null;
      } catch (error) {
        this.logger.warn(`⚠️ [STATS] Erreur lors de la récupération des stats: ${error.message}`);
      }

      this.logger.log(`✅ [STATS] Stats récupérées:`, stats);
      return stats;
    } finally {
      await browser.close();
    }
  }

  /**
   * Essaie de récupérer le username à partir de la page profil.
   */
  async getUsername(cookies: Cookie[] | string[] | string): Promise<string | null> {
    this.logger.log('👤 [USERNAME] Récupération du username TikTok...');
    const { browser, page } = await this.createContextFromCookies(cookies);

    try {
      await page.waitForTimeout(2000);

      const url = page.url();
      const urlMatch = url.match(/tiktok\.com\/@([^/?]+)/);
      if (urlMatch && urlMatch[1] && urlMatch[1] !== 'me') {
        const username = decodeURIComponent(urlMatch[1]);
        this.logger.log(`✅ [USERNAME] Username trouvé depuis l'URL: @${username}`);
        return username;
      }

      // Fallback : chercher un sélecteur typique
      const handleSelector = 'h1[data-e2e="user-title"]';
      const element = await page.$(handleSelector);
      if (element) {
        const text = await page.textContent(handleSelector);
        const username = text?.replace('@', '').trim() || null;
        if (username && username !== 'me') {
          this.logger.log(`✅ [USERNAME] Username trouvé depuis le DOM: @${username}`);
          return username;
        }
      }

      this.logger.warn('⚠️ [USERNAME] Impossible de récupérer le username (sélecteurs à adapter).');
      return null;
    } finally {
      await browser.close();
    }
  }

  /**
   * Récupère un maximum d'interactions (likes, commentaires, follows...) depuis la page notifications.
   */
  async getAllInteractions(cookies: Cookie[] | string[] | string): Promise<{
    likes: any[];
    comments: any[];
    follows: any[];
    shares: any[];
    mentions: any[];
  }> {
    this.logger.log('📊 [INTERACTIONS] Récupération des interactions TikTok...');
    const { browser, page } = await this.createContextFromCookies(cookies);

    const likes: any[] = [];
    const comments: any[] = [];
    const follows: any[] = [];
    const shares: any[] = [];
    const mentions: any[] = [];

    try {
      // 🔥 CRITIQUE : Aller sur /notifications et vérifier qu'on n'est pas sur 404
      this.logger.log('🔍 [INTERACTIONS] Navigation vers /notifications...');
      await page.goto('https://www.tiktok.com/notifications', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      const finalUrl = page.url();
      this.logger.log(`🔎 [INTERACTIONS] URL finale après chargement: ${finalUrl}`);

      // 🔥 CRITIQUE : Vérifier qu'on n'est pas sur 404
      if (finalUrl.includes('/404') || finalUrl.includes('/login')) {
        this.logger.error(`❌ [INTERACTIONS] Session invalide - Redirigé vers: ${finalUrl}`);
        throw new Error(`TikTok session not logged in - URL: ${finalUrl}`);
      }

      // Laisse le temps que le feed de notifs se charge
      await page.waitForTimeout(5000);

      // Scroll pour charger plusieurs pages de notifs
      for (let i = 0; i < 5; i++) {
        await page.mouse.wheel(0, 1500);
        await page.waitForTimeout(2000);
      }

      // Sélecteur à adapter selon le DOM réel.
      const notifSelector = '[data-e2e="notification-item"]';

      const notifications = await page.$$(notifSelector);
      this.logger.log(
        `🔎 [INTERACTIONS] ${notifications.length} notifications détectées`,
      );

      for (const notif of notifications) {
        const text = (await notif.innerText()).toLowerCase();

        // Hyper simplifié : à adapter selon tes textes FR actuels
        const actorHandle =
          (await notif.getAttribute('data-e2e-user-name')) || '';

        const base = {
          actorUsername: actorHandle,
          rawText: text,
        };

        if (text.includes('a aimé') || text.includes('liked')) {
          likes.push(base);
        } else if (text.includes('a commenté') || text.includes('commented')) {
          comments.push(base);
        } else if (text.includes('vous suit') || text.includes('followed')) {
          follows.push(base);
        } else if (text.includes('a partagé') || text.includes('shared')) {
          shares.push(base);
        } else if (text.includes('@') || text.includes('mention')) {
          mentions.push(base);
        }
      }

      this.logger.log(
        `✅ [INTERACTIONS] likes=${likes.length}, comments=${comments.length}, follows=${follows.length}, shares=${shares.length}, mentions=${mentions.length}`,
      );

      return { likes, comments, follows, shares, mentions };
    } catch (error) {
      this.logger.error(
        `❌ [INTERACTIONS] Erreur lors de la récupération des interactions: ${error.message}`,
      );
      throw error; // Propager l'erreur pour que l'appelant sache que la session est invalide
    } finally {
      await browser.close();
    }
  }

  /**
   * Récupère les derniers messages (inbox).
   */
  async getMessages(cookies: Cookie[] | string[] | string): Promise<any[]> {
    this.logger.log('💬 [DM] Récupération des messages TikTok...');
    const { browser, page } = await this.createContextFromCookies(cookies);

    const messages: any[] = [];

    try {
      await page.goto('https://www.tiktok.com/messages', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      
      // 🔥 CRITIQUE : Vérifier qu'on n'est pas sur 404
      const finalUrl = page.url();
      if (finalUrl.includes('/404') || finalUrl.includes('/login')) {
        this.logger.error(`❌ [DM] Session invalide - Redirigé vers: ${finalUrl}`);
        throw new Error(`TikTok session not logged in - URL: ${finalUrl}`);
      }
      
      await page.waitForTimeout(5000);

      // Squelette générique, DOM à adapter
      const convSelector = '[data-e2e="chat-list-item"]';
      const convs = await page.$$(convSelector);

      for (const conv of convs) {
        const name =
          (await conv.getAttribute('data-e2e-chat-item-name')) ||
          (await conv.innerText());
        messages.push({
          conversationName: name?.trim(),
        });
      }

      this.logger.log(
        `✅ [DM] Conversations détectées: ${messages.length} (détails à enrichir)`,
      );

      return messages;
    } catch (error) {
      this.logger.error(
        `❌ [DM] Erreur lors de la récupération des messages: ${error.message}`,
      );
      throw error;
    } finally {
      await browser.close();
    }
  }

  /**
   * Récupère les derniers followers.
   */
  async getRecentFollowers(cookies: Cookie[] | string[] | string): Promise<any[]> {
    this.logger.log('👥 [FOLLOWERS] Récupération des derniers followers...');
    const { browser, page } = await this.createContextFromCookies(cookies);

    const followers: any[] = [];

    try {
      await page.goto('https://www.tiktok.com/@me/followers', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      
      // 🔥 CRITIQUE : Vérifier qu'on n'est pas sur 404
      const finalUrl = page.url();
      if (finalUrl.includes('/404') || finalUrl.includes('/login')) {
        this.logger.error(`❌ [FOLLOWERS] Session invalide - Redirigé vers: ${finalUrl}`);
        throw new Error(`TikTok session not logged in - URL: ${finalUrl}`);
      }
      
      await page.waitForTimeout(5000);

      const followerSelector = '[data-e2e="user-card"]';
      const nodes = await page.$$(followerSelector);

      for (const node of nodes) {
        const username = (await node.innerText())?.trim();
        followers.push({ username });
      }

      this.logger.log(
        `✅ [FOLLOWERS] ${followers.length} followers détectés (squelette)`,
      );
      return followers;
    } catch (error) {
      this.logger.error(
        `❌ [FOLLOWERS] Erreur lors de la récupération des followers: ${error.message}`,
      );
      throw error;
    } finally {
      await browser.close();
    }
  }

  /**
   * Envoie un DM à un utilisateur donné avec comportement humain.
   * 
   * Flow :
   * 1. Va sur le profil de l'utilisateur
   * 2. Clique sur "Message" (comme un humain)
   * 3. Attend que la conversation s'ouvre
   * 4. Tape le message caractère par caractère (comme un humain)
   * 5. Clique sur "Send" ou appuie sur Enter
   * 
   * Rate limiting : Max 10 DM/heure pour éviter les bans
   */
  async sendDm(
    username: string,
    message: string,
    cookies: Cookie[] | string[] | string,
    workspaceId: string,
    accountId?: string, // Pour le rate limiting
    rateLimiter?: any, // TikTokRateLimiterService (injecté dynamiquement)
  ) {
    this.logger.log(`✉️ [DM] Envoi d'un DM à @${username}...`);

    // Vérifier le rate limiting si disponible
    if (rateLimiter && accountId) {
      const canSend = await rateLimiter.canSendDM(accountId);
      if (!canSend.allowed) {
        this.logger.warn(
          `⚠️ [DM] Rate limit atteint: ${canSend.reason}. Retry after: ${canSend.retryAfter}s`,
        );
        throw new Error(
          `RATE_LIMIT_EXCEEDED: ${canSend.reason}. Retry after ${canSend.retryAfter}s`,
        );
      }
    }

    const { browser, page } = await this.createContextFromCookies(cookies);

    try {
      // Vérifier que la session est valide
      const isValid = await this.validateSession(page);
      if (!isValid) {
        throw new Error('SESSION_EXPIRED');
      }

      // Ouvre la page de profil
      await page.goto(`https://www.tiktok.com/@${username}`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Délai humain avant de cliquer
      await this.humanDelay(2000, 4000);

      // Chercher le bouton "Message" avec plusieurs sélecteurs
      const messageButtonSelectors = [
        'button:has-text("Message")',
        'button:has-text("message")',
        '[data-e2e="message-button"]',
        'a[href*="/messages"]',
        'div[role="button"]:has-text("Message")',
      ];

      let msgButton = null;
      for (const selector of messageButtonSelectors) {
        try {
          msgButton = await page.$(selector);
          if (msgButton) {
            const isVisible = await msgButton.isVisible();
            if (isVisible) {
              this.logger.log(`✅ [DM] Bouton Message trouvé avec: ${selector}`);
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }

      if (!msgButton) {
        this.logger.warn(
          `⚠️ [DM] Bouton "Message" non trouvé pour @${username}.`,
        );
        return { success: false, reason: 'Message button not found' };
      }

      // Clic humain sur le bouton
      await this.humanClick(page, msgButton);
      await this.humanDelay(2000, 4000);

      // Attendre que la conversation s'ouvre
      // La zone de texte peut être dans différents formats
      const textareaSelectors = [
        'div[contenteditable="true"]',
        'textarea',
        '[data-e2e="message-input"]',
        '[class*="message-input"]',
        '[class*="text-input"]',
      ];

      let textarea = null;
      for (const selector of textareaSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          textarea = await page.$(selector);
          if (textarea) {
            const isVisible = await textarea.isVisible();
            if (isVisible) {
              this.logger.log(`✅ [DM] Zone de texte trouvée avec: ${selector}`);
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }

      if (!textarea) {
        this.logger.warn('⚠️ [DM] Zone de texte non trouvée.');
        return { success: false, reason: 'Textarea not found' };
      }

      // Cliquer sur la zone de texte
      await this.humanClick(page, textarea);
      await this.humanDelay(500, 1000);

      // Taper le message caractère par caractère (comme un humain)
      await this.humanType(page, textarea, message);

      // Attendre un peu avant d'envoyer
      await this.humanDelay(1000, 2000);

      // Chercher le bouton Send ou appuyer sur Enter
      const sendButtonSelectors = [
        'button:has-text("Send")',
        'button[type="submit"]',
        '[data-e2e="send-button"]',
        '[aria-label*="Send"]',
      ];

      let sendButton = null;
      for (const selector of sendButtonSelectors) {
        try {
          sendButton = await page.$(selector);
          if (sendButton) {
            const isVisible = await sendButton.isVisible();
            if (isVisible) {
              await this.humanClick(page, sendButton);
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }

      // Si pas de bouton Send, utiliser Enter
      if (!sendButton) {
        await page.keyboard.press('Enter');
      }

      // Attendre que le message soit envoyé
      await this.humanDelay(2000, 3000);

      // Enregistrer l'envoi pour le rate limiting
      if (rateLimiter && accountId) {
        await rateLimiter.recordDMSent(accountId);
      }

      this.logger.log(`✅ [DM] Message envoyé à @${username}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `❌ [DM] Erreur lors de l'envoi du DM à @${username}: ${error.message}`,
      );
      
      // Si c'est une erreur de session expirée, la propager
      if (error.message.includes('SESSION_EXPIRED')) {
        throw new Error('SESSION_EXPIRED');
      }
      
      return { success: false, reason: error.message };
    } finally {
      await browser.close();
    }
  }

  /**
   * Délai aléatoire pour simuler le comportement humain
   */
  private async humanDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise((resolve) => setTimeout(resolve, delay));
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

  /**
   * Tape un texte caractère par caractère comme un humain
   */
  private async humanType(page: Page, element: any, text: string): Promise<void> {
    for (const char of text) {
      await element.type(char, { delay: Math.random() * 100 + 50 }); // 50-150ms entre chaque caractère
    }
  }
}
