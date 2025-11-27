// backend/src/social-accounts/providers/tiktok-qr-connection.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { chromium } from 'playwright-extra';
import { Browser, BrowserContext, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Utiliser le plugin stealth pour éviter la détection
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(StealthPlugin());

interface QRConnectionState {
  connectionId: string;
  qrCodeBase64: string | null;
  status: 'waiting' | 'scanning' | 'connected' | 'expired' | 'error';
  username?: string;
  userId?: string;
  cookies?: any[];
  error?: string;
  createdAt: Date;
  expiresAt: Date;
}

@Injectable()
export class TikTokQRConnectionService {
  private readonly logger = new Logger(TikTokQRConnectionService.name);
  private activeConnections: Map<string, QRConnectionState> = new Map();
  private browserInstances: Map<string, { browser: Browser; context: BrowserContext; page: Page }> = new Map();

  /**
   * Initialise une nouvelle connexion TikTok via QR code
   */
  async initiateQRConnection(workspaceId: string): Promise<{
    connectionId: string;
    qrCodeBase64: string;
    expiresAt: Date;
  }> {
    const connectionId = `tiktok_qr_${workspaceId}_${Date.now()}`;
    this.logger.log(`🔐 [QR] Initialisation connexion QR pour workspace: ${workspaceId}`);

    // Nettoyer les anciennes connexions expirées
    this.cleanupExpiredConnections();

    // Lancer un navigateur isolé pour cette connexion
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

    // Stocker l'instance du navigateur
    this.browserInstances.set(connectionId, { browser, context, page });

    // Initialiser l'état de connexion
    const state: QRConnectionState = {
      connectionId,
      qrCodeBase64: null,
      status: 'waiting',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    };
    this.activeConnections.set(connectionId, state);

    try {
      // Aller sur la page de login TikTok
      this.logger.log('🌐 [QR] Navigation vers la page de login TikTok...');
      
      // URL principale pour le QR code TikTok
      const loginUrl = 'https://www.tiktok.com/login';
      this.logger.log(`🌐 [QR] Navigation vers ${loginUrl}...`);
      
      await page.goto(loginUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // Attendre que la page charge complètement
      await page.waitForTimeout(5000);

      // Chercher et cliquer sur le bouton "Use QR code" avec plusieurs sélecteurs
      this.logger.log('🔍 [QR] Recherche du bouton QR code...');
      let qrButtonClicked = false;
      
      // Sélecteurs possibles pour le bouton QR code
      const qrButtonSelectors = [
        'button:has-text("QR")',
        'button:has-text("qr")',
        'button:has-text("QR code")',
        'button:has-text("Scan QR")',
        '[data-e2e="login-use-qr-code"]',
        'a[href*="qr"]',
        'a[href*="QR"]',
        'div[class*="qr"]',
        'div[class*="QR"]',
        'span:has-text("QR")',
        'span:has-text("qr")',
        '[aria-label*="QR"]',
        '[aria-label*="qr"]',
      ];

      for (const selector of qrButtonSelectors) {
        try {
          const button = await page.$(selector);
          if (button) {
            const isVisible = await button.isVisible();
            if (isVisible) {
              this.logger.log(`🖱️ [QR] Bouton trouvé avec: ${selector}, clic en cours...`);
              await button.click();
              await page.waitForTimeout(3000); // Attendre que le QR code apparaisse
              qrButtonClicked = true;
              this.logger.log('✅ [QR] Bouton QR code cliqué');
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }

      // Si aucun bouton trouvé, essayer de trouver tous les boutons et cliquer sur celui qui contient "QR"
      if (!qrButtonClicked) {
        try {
          const allButtons = await page.$$('button, a, div[role="button"]');
          this.logger.log(`🔍 [QR] ${allButtons.length} boutons trouvés sur la page`);
          
          for (const btn of allButtons) {
            try {
              const text = await btn.textContent();
              const ariaLabel = await btn.getAttribute('aria-label');
              if (text && (text.toLowerCase().includes('qr') || text.toLowerCase().includes('scan'))) {
                const isVisible = await btn.isVisible();
                if (isVisible) {
                  this.logger.log(`🖱️ [QR] Bouton trouvé par texte: "${text}", clic en cours...`);
                  await btn.click();
                  await page.waitForTimeout(3000);
                  qrButtonClicked = true;
                  break;
                }
              } else if (ariaLabel && (ariaLabel.toLowerCase().includes('qr') || ariaLabel.toLowerCase().includes('scan'))) {
                const isVisible = await btn.isVisible();
                if (isVisible) {
                  this.logger.log(`🖱️ [QR] Bouton trouvé par aria-label: "${ariaLabel}", clic en cours...`);
                  await btn.click();
                  await page.waitForTimeout(3000);
                  qrButtonClicked = true;
                  break;
                }
              }
            } catch (e) {
              continue;
            }
          }
        } catch (e) {
          this.logger.warn('⚠️ [QR] Erreur lors de la recherche des boutons');
        }
      }

      // Attendre encore un peu pour que le QR code se charge après le clic
      if (qrButtonClicked) {
        await page.waitForTimeout(2000);
      }

      // Prendre un screenshot pour debug
      if (process.env.PLAYWRIGHT_DEBUG === 'true') {
        await page.screenshot({ path: 'debug-tiktok-page.png', fullPage: true });
        this.logger.log('📸 [QR] Screenshot sauvegardé: debug-tiktok-page.png');
      }

      // Attendre que le QR code apparaisse avec plusieurs sélecteurs possibles
      this.logger.log('⏳ [QR] Recherche du QR code...');
      
      // Sélecteurs possibles pour le QR code TikTok
      const qrSelectors = [
        'canvas',
        'img[alt*="QR"]',
        'img[alt*="qr"]',
        'img[src*="qr"]',
        '[data-e2e="qr-code"]',
        '[data-e2e="qrCode"]',
        '[class*="qr"]',
        '[class*="QR"]',
        '[id*="qr"]',
        '[id*="QR"]',
        'svg',
        'div[class*="qr-code"]',
        'div[class*="QRCode"]',
      ];

      let qrElement = null;
      for (const selector of qrSelectors) {
        try {
          qrElement = await page.$(selector);
          if (qrElement) {
            const isVisible = await qrElement.isVisible();
            if (isVisible) {
              this.logger.log(`✅ [QR] QR code trouvé avec le sélecteur: ${selector}`);
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }

      if (!qrElement) {
        // Essayer de trouver n'importe quelle image ou canvas sur la page
        const allImages = await page.$$('img, canvas, svg');
        this.logger.log(`🔍 [QR] ${allImages.length} images/canvas trouvés sur la page`);
        
        if (allImages.length > 0) {
          // Prendre le premier élément visible qui pourrait être le QR code
          for (const img of allImages) {
            try {
              const isVisible = await img.isVisible();
              if (isVisible) {
                qrElement = img;
                this.logger.log('✅ [QR] Utilisation du premier élément image/canvas visible comme QR code');
                break;
              }
            } catch (e) {
              continue;
            }
          }
        }
      }

      // Si le QR code n'est pas trouvé, prendre un screenshot de la page de login
      // L'utilisateur pourra scanner directement depuis le screenshot
      if (!qrElement) {
        this.logger.warn('⚠️ [QR] QR code non trouvé avec les sélecteurs, utilisation du screenshot de la page');
        
        // Prendre un screenshot de la zone de login (probablement au centre)
        const viewport = page.viewportSize();
        let qrCodeBase64: string | null = null;
        
        if (viewport) {
          // Screenshot de la zone centrale (où se trouve généralement le QR code)
          const buffer = await page.screenshot({
            clip: {
              x: Math.max(0, viewport.width / 2 - 400),
              y: Math.max(0, viewport.height / 2 - 400),
              width: 800,
              height: 800,
            },
          });
          qrCodeBase64 = buffer.toString('base64');
          this.logger.log('✅ [QR] Screenshot de la zone de login généré (800x800) - l\'utilisateur peut scanner depuis cette image');
        } else {
          // Fallback: screenshot de toute la page visible
          const buffer = await page.screenshot({ fullPage: false });
          qrCodeBase64 = buffer.toString('base64');
          this.logger.log('✅ [QR] Screenshot de la page visible généré');
        }
        
        // Mettre à jour l'état directement avec le screenshot
        state.qrCodeBase64 = qrCodeBase64;
        state.status = 'scanning';
        this.activeConnections.set(connectionId, state);
        
        // Démarrer le polling
        this.startConnectionPolling(connectionId, page);
        
        return {
          connectionId,
          qrCodeBase64: qrCodeBase64!,
          expiresAt: state.expiresAt,
        };
      }

      // Récupérer le QR code depuis l'élément trouvé
      let qrCodeBase64: string | null = null;

      if (qrElement) {
        try {
          const tagName = await qrElement.evaluate((el) => el.tagName.toLowerCase());
          
          if (tagName === 'canvas') {
            // Canvas - prendre un screenshot
            const buffer = await qrElement.screenshot();
            qrCodeBase64 = buffer.toString('base64');
            this.logger.log('✅ [QR] QR code récupéré depuis canvas');
          } else if (tagName === 'img') {
            // Image - récupérer le src
            const src = await qrElement.getAttribute('src');
            if (src) {
              if (src.startsWith('data:image')) {
                qrCodeBase64 = src.split(',')[1];
                this.logger.log('✅ [QR] QR code récupéré depuis image data URL');
              } else if (src.startsWith('http')) {
                // Si c'est une URL externe, télécharger l'image
                try {
                  const response = await page.evaluate(async (url) => {
                    const res = await fetch(url);
                    const blob = await res.blob();
                    return new Promise((resolve) => {
                      const reader = new FileReader();
                      reader.onloadend = () => resolve(reader.result);
                      reader.readAsDataURL(blob);
                    });
                  }, src);
                  if (typeof response === 'string' && response.startsWith('data:image')) {
                    qrCodeBase64 = response.split(',')[1];
                    this.logger.log('✅ [QR] QR code récupéré depuis URL externe');
                  }
                } catch (e) {
                  this.logger.warn(`⚠️ [QR] Impossible de télécharger l'image depuis ${src}`);
                }
              } else {
                // Screenshot de l'image
                const buffer = await qrElement.screenshot();
                qrCodeBase64 = buffer.toString('base64');
                this.logger.log('✅ [QR] QR code récupéré depuis screenshot de l\'image');
              }
            }
          } else if (tagName === 'svg') {
            // SVG - screenshot
            const buffer = await qrElement.screenshot();
            qrCodeBase64 = buffer.toString('base64');
            this.logger.log('✅ [QR] QR code récupéré depuis SVG');
          } else {
            // Autre élément - screenshot
            const buffer = await qrElement.screenshot();
            qrCodeBase64 = buffer.toString('base64');
            this.logger.log(`✅ [QR] QR code récupéré depuis ${tagName}`);
          }
        } catch (e) {
          this.logger.warn(`⚠️ [QR] Erreur lors de la récupération: ${e.message}`);
        }
      }

      // Si toujours pas de QR code, essayer de trouver le container parent
      if (!qrCodeBase64 && qrElement) {
        try {
          const container = await qrElement.evaluateHandle((el) => {
            let parent = el.parentElement;
            while (parent && parent !== document.body) {
              const rect = parent.getBoundingClientRect();
              if (rect.width > 200 && rect.height > 200) {
                return parent;
              }
              parent = parent.parentElement;
            }
            return el;
          });
          const buffer = await container.screenshot();
          qrCodeBase64 = buffer.toString('base64');
          this.logger.log('✅ [QR] QR code récupéré depuis le container parent');
        } catch (e) {
          this.logger.warn('⚠️ [QR] Impossible de récupérer depuis le container');
        }
      }

      // Dernier recours: screenshot de la zone centrale de la page
      if (!qrCodeBase64) {
        try {
          const viewport = page.viewportSize();
          if (viewport) {
            // Zone plus large pour capturer le QR code même s'il est décalé
            const centerX = viewport.width / 2;
            const centerY = viewport.height / 2;
            const buffer = await page.screenshot({
              clip: {
                x: Math.max(0, centerX - 300),
                y: Math.max(0, centerY - 300),
                width: 600,
                height: 600,
              },
            });
            qrCodeBase64 = buffer.toString('base64');
            this.logger.warn('⚠️ [QR] Utilisation du screenshot de la zone centrale (600x600) comme fallback');
          }
        } catch (e) {
          // Fallback final: screenshot de toute la page visible
          const buffer = await page.screenshot({ fullPage: false });
          qrCodeBase64 = buffer.toString('base64');
          this.logger.warn('⚠️ [QR] Utilisation du screenshot de la page visible comme fallback final');
        }
      }

      // Mettre à jour l'état
      state.qrCodeBase64 = qrCodeBase64;
      state.status = 'scanning';
      this.activeConnections.set(connectionId, state);

      // Démarrer le polling pour vérifier la connexion
      this.startConnectionPolling(connectionId, page);

      return {
        connectionId,
        qrCodeBase64: qrCodeBase64!,
        expiresAt: state.expiresAt,
      };
    } catch (error) {
      this.logger.error(`❌ [QR] Erreur lors de l'initialisation: ${error.message}`);
      state.status = 'error';
      state.error = error.message;
      this.activeConnections.set(connectionId, state);
      throw error;
    }
  }

  /**
   * Polling pour vérifier si l'utilisateur a scanné le QR code
   */
  private async startConnectionPolling(connectionId: string, page: Page): Promise<void> {
    const maxAttempts = 60; // 5 minutes max (5s * 60)
    let attempts = 0;

    const poll = async () => {
      try {
        const state = this.activeConnections.get(connectionId);
        if (!state || state.status !== 'scanning') {
          return; // Connexion terminée ou annulée
        }

        // Vérifier si on est connecté (URL a changé ou on est sur @me)
        const currentUrl = page.url();
        this.logger.log(`🔍 [QR] Polling ${attempts}/${maxAttempts} - URL: ${currentUrl}`);

        // Si on n'est plus sur la page de login, c'est qu'on est connecté
        if (!currentUrl.includes('/login') && currentUrl.includes('tiktok.com')) {
          // Vérifier qu'on est bien connecté en allant sur @me
          await page.goto('https://www.tiktok.com/@me', {
            waitUntil: 'networkidle',
            timeout: 15000,
          });

          const finalUrl = page.url();
          if (!finalUrl.includes('/login') && !finalUrl.includes('/404')) {
            // ✅ Connexion réussie !
            this.logger.log('✅ [QR] Connexion TikTok réussie via QR code !');

            // Récupérer les cookies
            const { context } = this.browserInstances.get(connectionId)!;
            const cookies = await context.cookies([
              'https://tiktok.com',
              'https://www.tiktok.com',
              'https://m.tiktok.com',
            ]);

            // Récupérer le username
            let username = 'tiktok_user';
            const urlMatch = finalUrl.match(/tiktok\.com\/@([^/?]+)/);
            if (urlMatch && urlMatch[1] && urlMatch[1] !== 'me') {
              username = decodeURIComponent(urlMatch[1]);
            }

            // Récupérer le userId depuis les cookies
            const uidCookie = cookies.find((c) => c.name === 'uid_tt');
            const userId = uidCookie?.value || '';

            // Mettre à jour l'état
            state.status = 'connected';
            state.username = username;
            state.userId = userId;
            state.cookies = cookies;
            this.activeConnections.set(connectionId, state);

            return; // Connexion réussie, arrêter le polling
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          // Continuer le polling
          setTimeout(poll, 5000); // Vérifier toutes les 5 secondes
        } else {
          // Timeout
          this.logger.warn('⏰ [QR] Timeout - QR code expiré');
          state.status = 'expired';
          this.activeConnections.set(connectionId, state);
        }
      } catch (error) {
        this.logger.error(`❌ [QR] Erreur lors du polling: ${error.message}`);
        const state = this.activeConnections.get(connectionId);
        if (state) {
          state.status = 'error';
          state.error = error.message;
          this.activeConnections.set(connectionId, state);
        }
      }
    };

    // Démarrer le polling après 5 secondes
    setTimeout(poll, 5000);
  }

  /**
   * Récupère le statut d'une connexion QR
   */
  getConnectionStatus(connectionId: string): QRConnectionState | null {
    const state = this.activeConnections.get(connectionId);
    if (!state) {
      return null;
    }

    // Vérifier si expiré
    if (new Date() > state.expiresAt && state.status === 'scanning') {
      state.status = 'expired';
      this.activeConnections.set(connectionId, state);
    }

    return state;
  }

  /**
   * Récupère les cookies d'une connexion réussie
   */
  async getConnectionCookies(connectionId: string): Promise<{
    cookies: any[];
    username: string;
    userId: string;
  } | null> {
    const state = this.activeConnections.get(connectionId);
    if (!state || state.status !== 'connected' || !state.cookies) {
      return null;
    }

    return {
      cookies: state.cookies,
      username: state.username || 'tiktok_user',
      userId: state.userId || '',
    };
  }

  /**
   * Nettoie les connexions expirées
   */
  private cleanupExpiredConnections(): void {
    const now = new Date();
    for (const [connectionId, state] of this.activeConnections.entries()) {
      if (now > state.expiresAt) {
        // Fermer le navigateur associé
        const instance = this.browserInstances.get(connectionId);
        if (instance) {
          instance.browser.close().catch((e) => {
            this.logger.warn(`⚠️ [QR] Erreur lors de la fermeture du navigateur: ${e.message}`);
          });
          this.browserInstances.delete(connectionId);
        }
        this.activeConnections.delete(connectionId);
      }
    }
  }

  /**
   * Ferme une connexion et nettoie les ressources
   */
  async closeConnection(connectionId: string): Promise<void> {
    const instance = this.browserInstances.get(connectionId);
    if (instance) {
      await instance.browser.close();
      this.browserInstances.delete(connectionId);
    }
    this.activeConnections.delete(connectionId);
    this.logger.log(`🧹 [QR] Connexion ${connectionId} fermée et nettoyée`);
  }
}

