// backend/src/social-accounts/providers/tiktok-cookies.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { chromium } from 'playwright-extra';
import { Browser, BrowserContext, Page, Cookie } from 'playwright';
import { parseCookiesForPlaywright } from '../../utils/cookie-parser';

// Utiliser le plugin stealth pour éviter la détection
// Import en CommonJS car le plugin n'a pas de export default propre
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(StealthPlugin());

@Injectable()
export class TikTokCookiesService {
  private readonly logger = new Logger(TikTokCookiesService.name);

  private async createBrowser() {
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

    const page = await context.newPage();
    return { browser, context, page };
  }

  /**
   * Lance un navigateur, te laisse te connecter à TikTok,
   * puis récupère les cookies, username, userId.
   *
   * NOTE: à utiliser en local ou via une infra qui supporte l'UI.
   */
  async captureCookies(
    workspaceId?: string, // laissé optionnel pour éviter l'erreur d'argument
  ): Promise<{
    username: string;
    userId: string;
    cookies: string[]; // Retourner string[] pour compatibilité avec le reste du code
    instructions: string;
  }> {
    this.logger.log(
      `🎭 [COOKIES] Lancement capture cookies TikTok (workspace=${workspaceId || 'n/a'})`,
    );

    const { browser, context, page } = await this.createBrowser();

    try {
      await page.goto('https://www.tiktok.com/login', {
        waitUntil: 'networkidle',
      });

      this.logger.log(
        '✅ [COOKIES] Page de login TikTok ouverte. Connecte-toi manuellement.',
      );
      this.logger.log(
        'ℹ️ [COOKIES] Quand la connexion est faite, ferme simplement le navigateur ou appuie sur CTRL+C côté serveur si tu gères ça en local.',
      );

      // Ici tu peux rajouter un bouton côté front + polling si tu veux faire ça mieux.
      // Pour l'instant on attend que l'URL ne soit plus /login.
      await page.waitForTimeout(8000);

      // On laisse plus de temps pour les 2FA / captchas / etc.
      await page.waitForTimeout(15000);

      const currentUrl = page.url();
      this.logger.log(`🔎 [COOKIES] URL actuelle: ${currentUrl}`);

      // Récupérer les cookies depuis TOUS les domaines TikTok
      const cookies = await context.cookies([
        'https://tiktok.com',
        'https://www.tiktok.com',
        'https://m.tiktok.com',
      ]);

      this.logger.log(
        `🍪 [COOKIES] ${cookies.length} cookies capturés pour tiktok.com (tous domaines)`,
      );

      // Essayer de deviner le username & userId
      // 1. Si /@username dans l'URL
      let username = 'tiktok_user';
      let userId = '';

      const urlMatch = currentUrl.match(/tiktok\.com\/@([^/?]+)/);
      if (urlMatch && urlMatch[1]) {
        username = decodeURIComponent(urlMatch[1]);
      }

      // 2. Sinon, fallback : on garde l'id depuis les cookies (uid_tt)
      const uidCookie = cookies.find((c) => c.name === 'uid_tt');
      if (uidCookie) {
        userId = uidCookie.value;
      }

      this.logger.log(
        `👤 [COOKIES] Username détecté: ${username}, userId: ${userId || 'n/a'}`,
      );

      // Convertir les cookies en format string[] pour compatibilité avec le reste du code
      const cookieStrings = cookies.map(
        (cookie) => `${cookie.name}=${cookie.value}`,
      );

      return {
        username,
        userId: userId || username,
        cookies: cookieStrings, // Retourner en format string[] pour compatibilité
        instructions:
          'Cookies TikTok capturés avec succès. Utilise-les pour initialiser la session backend et démarrer le monitoring.',
      };
    } catch (error) {
      this.logger.error(
        `❌ [COOKIES] Erreur lors de la capture des cookies TikTok: ${error.message}`,
      );
      throw error;
    } finally {
      await browser.close();
    }
  }

  /**
   * Valide un set de cookies en essayant d'accéder à /@me.
   * Retourne true si on est logué, false sinon.
   * Supporte les formats: string[], string (brut collé), ou Cookie[]
   */
  async validateCookies(cookies: Cookie[] | string[] | string): Promise<boolean> {
    const cookieCount = Array.isArray(cookies) ? cookies.length : (typeof cookies === 'string' ? 1 : 0);
    this.logger.log(
      `🔍 [VALIDATE] Validation des cookies TikTok (${cookieCount} cookies)...`,
    );

    if (!cookies || (Array.isArray(cookies) && cookies.length === 0)) {
      this.logger.warn('⚠️ [VALIDATE] Aucun cookie fourni');
      return false;
    }

    // 🔥 CRITIQUE : Utiliser le parser intelligent pour formater correctement les cookies
    const cookieArray = parseCookiesForPlaywright(cookies);
    
    if (cookieArray.length === 0) {
      this.logger.warn('⚠️ [VALIDATE] Aucun cookie parsé');
      return false;
    }

    const browser = await chromium.launch({
      headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });

    try {
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

      this.logger.log(`🍪 [VALIDATE] Injection de ${cookieArray.length} cookies avec domain: .tiktok.com, path: /`);
      await context.addCookies(cookieArray);

      const page = await context.newPage();
      await page.goto('https://www.tiktok.com/@me', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      await page.waitForTimeout(3000);

      const url = page.url();
      this.logger.log(`🔎 [VALIDATE] URL après injection cookies: ${url}`);

      // 🔥 CRITIQUE : Vérifier qu'on n'est pas sur login ou 404
      if (url.includes('/login') || url.includes('/404')) {
        this.logger.error(
          `❌ [VALIDATE] Redirigé vers ${url} → cookies invalides ou expirés.`,
        );
        
        if (process.env.PLAYWRIGHT_DEBUG === 'true') {
          await page.screenshot({ path: 'tiktok_validate_failed.png', fullPage: true });
          this.logger.log('📸 [VALIDATE] Screenshot sauvegardé: tiktok_validate_failed.png');
        }
        
        return false;
      }

      // Optionnel : screenshot debug
      if (process.env.PLAYWRIGHT_DEBUG === 'true') {
        await page.screenshot({ path: 'tiktok_validate.png', fullPage: true });
        this.logger.log('📸 [VALIDATE] Screenshot sauvegardé: tiktok_validate.png');
      }

      this.logger.log('✅ [VALIDATE] Cookies valides, session active.');
      return true;
    } catch (error) {
      this.logger.error(
        `❌ [VALIDATE] Erreur lors de la validation des cookies: ${error.message}`,
      );
      return false;
    } finally {
      await browser.close();
    }
  }
}
