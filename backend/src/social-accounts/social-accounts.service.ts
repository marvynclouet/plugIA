import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InstagramService } from './providers/instagram.service';
import { FacebookService } from './providers/facebook.service';
import { TikTokService } from './providers/tiktok.service';
import { TikTokBrowserService } from './providers/tiktok-browser.service';
import { TikTokCookiesService } from './providers/tiktok-cookies.service';
import { TikTokMonitorService } from './providers/tiktok-monitor.service';
import { TikTokQRConnectionService } from './providers/tiktok-qr-connection.service';
import { InteractionsService } from '../interactions/interactions.service';
import { parseCookiesForPlaywright } from '../utils/cookie-parser';
import * as crypto from 'crypto';

@Injectable()
export class SocialAccountsService {
  private readonly logger = new Logger(SocialAccountsService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly key = Buffer.from(
    process.env.ENCRYPTION_KEY || 'default-key-32-chars-long!!',
    'utf-8',
  ).slice(0, 32);
  private connectingWorkspaces: Set<string> = new Set(); // Protection contre les connexions multiples

  constructor(
    private prisma: PrismaService,
    private instagramService: InstagramService,
    private facebookService: FacebookService,
    private tiktokService: TikTokService,
    private tiktokBrowserService: TikTokBrowserService,
    private tiktokCookiesService: TikTokCookiesService,
    private tiktokMonitorService: TikTokMonitorService,
    private tiktokQRConnectionService: TikTokQRConnectionService,
    @Inject(forwardRef(() => InteractionsService))
    private interactionsService?: InteractionsService,
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

  /**
   * Chiffre les cookies pour stockage sécurisé
   */
  encryptCookies(cookies: string[]): string {
    const cookiesJson = JSON.stringify(cookies);
    return this.encrypt(cookiesJson);
  }

  /**
   * Déchiffre les cookies depuis le stockage
   */
  decryptCookies(encryptedCookies: string): string[] {
    try {
      const decrypted = this.decrypt(encryptedCookies);
      return JSON.parse(decrypted);
    } catch (error) {
      // Fallback: si le déchiffrement échoue, essayer de parser directement (pour compatibilité avec anciennes données)
      try {
        return JSON.parse(encryptedCookies);
      } catch {
        throw new Error('Failed to decrypt cookies');
      }
    }
  }

  /**
   * Récupère et déchiffre les cookies d'un compte social
   */
  async getDecryptedCookies(accountId: string): Promise<string[]> {
    const session = await this.prisma.socialSession.findUnique({
      where: { socialAccountId: accountId },
    });

    if (!session || !session.cookies) {
      throw new Error('No cookies found for this account');
    }

    return this.decryptCookies(session.cookies);
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

    const account = await this.create(workspaceId, 'instagram', {
      platformUserId: userInfo.id,
      platformUsername: userInfo.username,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null,
      scopes: ['instagram_basic', 'instagram_manage_messages', 'pages_read_engagement'],
    });

    // Collecter automatiquement les interactions après connexion
    this.collectInteractionsAfterConnection(account.id).catch((error) => {
      this.logger.warn('Failed to collect interactions after Instagram connection:', error);
    });

    return account;
  }

  async getFacebookAuthUrl(workspaceId: string) {
    return this.facebookService.getAuthUrl(workspaceId);
  }

  async handleFacebookCallback(code: string, workspaceId: string) {
    const tokens = await this.facebookService.exchangeCode(code);
    const userInfo = await this.facebookService.getUserInfo(
      tokens.access_token,
    );
    
    // Pour Facebook, on peut aussi récupérer les Pages associées
    // Ici on stocke le compte utilisateur principal, les Pages seront gérées séparément si besoin
    const pages = await this.facebookService.getPages(tokens.access_token);

    const account = await this.create(workspaceId, 'facebook', {
      platformUserId: userInfo.id,
      platformUsername: userInfo.name || userInfo.email || userInfo.id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null,
      scopes: ['pages_manage_posts', 'pages_messaging', 'pages_read_engagement', 'pages_show_list'],
    });

    // Collecter automatiquement les interactions après connexion
    this.collectInteractionsAfterConnection(account.id).catch((error) => {
      this.logger.warn('Failed to collect interactions after Facebook connection:', error);
    });

    return account;
  }

  // TikTok Methods
  async getTikTokAuthUrl(workspaceId: string) {
    console.log('📱 Getting TikTok auth URL for workspace:', workspaceId);
    try {
      const url = await this.tiktokService.getAuthUrl(workspaceId);
      console.log('✅ TikTok auth URL generated successfully');
      return url;
    } catch (error) {
      console.error('❌ Error in getTikTokAuthUrl:', error);
      throw error;
    }
  }

  async handleTikTokCallback(code: string, workspaceId: string) {
    const tokens = await this.tiktokService.exchangeCode(code);
    const userInfo = await this.tiktokService.getUserInfo(tokens.access_token);

    const account = await this.create(workspaceId, 'tiktok', {
      platformUserId: userInfo.open_id,
      platformUsername: userInfo.username || userInfo.display_name,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null,
      scopes: tokens.scope ? tokens.scope.split(',') : [],
    });

    // Collecter automatiquement les interactions après connexion
    this.collectInteractionsAfterConnection(account.id).catch((error) => {
      this.logger.warn('Failed to collect interactions after TikTok OAuth connection:', error);
    });

    return account;
  }

  /**
   * Crée un compte TikTok à partir de cookies fournis manuellement
   * Supporte les formats: string[] (standard), string (brut collé), ou Cookie[]
   */
  async createTikTokAccountFromCookies(
    workspaceId: string,
    cookies: string[] | string,
  ): Promise<{
    accountId: string;
    username: string;
    cookies: string[];
    instructions: string;
  }> {
    // Protection : éviter les appels multiples simultanés pour le même workspace
    if (this.connectingWorkspaces.has(workspaceId)) {
      this.logger.warn(`⚠️ [SERVICE] TikTok connection already in progress for workspace: ${workspaceId}`);
      // Attendre un peu et vérifier si un compte existe déjà
      await new Promise(resolve => setTimeout(resolve, 2000));
      const existingAccount = await this.prisma.socialAccount.findFirst({
        where: { workspaceId, platform: 'tiktok' },
      });
      if (existingAccount) {
        const session = await this.prisma.socialSession.findUnique({
          where: { socialAccountId: existingAccount.id },
        });
        const existingCookies: string[] = session ? this.decryptCookies(session.cookies) : [];
        return {
          accountId: existingAccount.id,
          username: existingAccount.platformUsername,
          cookies: existingCookies,
          instructions: 'Compte TikTok déjà connecté.',
        };
      }
      throw new Error('Connexion TikTok déjà en cours pour ce workspace. Veuillez patienter.');
    }

    this.connectingWorkspaces.add(workspaceId);
    this.logger.log(`🍪 [SERVICE] Creating TikTok account from cookies for workspace: ${workspaceId}`);
    
    // Normaliser les cookies en string[] pour le traitement
    let cookieArray: string[] = [];
    if (typeof cookies === 'string') {
      // Si c'est une string unique (format brut collé), la traiter comme un array avec un seul élément
      cookieArray = [cookies];
      this.logger.log(`🍪 [SERVICE] Cookies reçus: format brut (string unique, ${cookies.length} caractères)`);
    } else {
      cookieArray = cookies;
      this.logger.log(`🍪 [SERVICE] Cookies reçus: ${cookies.length} cookies (array)`);
    }
    
    // 🔍 DEBUG : Afficher les premiers cookies pour voir le format
    this.logger.log(`🔍 [DEBUG] Format des cookies (3 premiers):`);
    cookieArray.slice(0, 3).forEach((cookie, idx) => {
      this.logger.log(`   ${idx + 1}. ${cookie.substring(0, 100)}${cookie.length > 100 ? '...' : ''}`);
    });

    try {
    
    // 🔥 PARSER LES COOKIES avec le parser intelligent
    // Le parser gère: format brut collé, tabulaire, standard, etc.
    const parsedCookies = parseCookiesForPlaywright(cookies);
    this.logger.log(`✅ [PARSER] ${parsedCookies.length} cookies parsés avec succès`);
    
    // Extraire les noms de cookies pour validation
    const cookieNames = parsedCookies.map(c => c.name.toLowerCase());
    const cookieMap = new Map<string, string>();
    parsedCookies.forEach(c => {
      cookieMap.set(c.name.toLowerCase(), c.value);
    });
    
    // 🔍 DEBUG : Afficher TOUS les noms de cookies pour diagnostic
    this.logger.log(`\n🔍 [DEBUG] Liste complète des cookies parsés (${cookieNames.length}):`);
    const uniqueCookieNames = [...new Set(cookieNames)].sort();
    this.logger.log(`   ${uniqueCookieNames.join(', ')}`);
    
    // 🔥 VÉRIFIER LA PRÉSENCE DE msToken (LE COOKIE INDISPENSABLE)
    const hasMsToken = cookieNames.some(name => name === 'mstoken' || name.includes('mstoken'));
    const hasSessionId = cookieNames.some(name => name === 'sessionid' || name === 'sessionid_ss');
    const hasSidTt = cookieNames.some(name => name === 'sid_tt');
    const hasSidGuard = cookieNames.some(name => name === 'sid_guard');
    const hasSidUcp = cookieNames.some(name => name === 'sid_ucp_v1' || name === 'ssid_ucp_v1');
    const hasUidTt = cookieNames.some(name => name === 'uid_tt');
    const hasTtwid = cookieNames.some(name => name === 'ttwid');
    
    // Compter les cookies essentiels présents
    const essentialCookiesCount = [hasSidTt, hasSidUcp, hasUidTt, hasTtwid].filter(Boolean).length;
    const hasMinimumEssential = essentialCookiesCount >= 3; // Au moins 3 sur 4
    
    this.logger.log(`\n${'='.repeat(80)}`);
    this.logger.log(`🔍 [SERVICE] VÉRIFICATION DES COOKIES ESSENTIELS`);
    this.logger.log(`${'='.repeat(80)}`);
    const cookiesLength = typeof cookies === 'string' ? 1 : (Array.isArray(cookies) ? cookies.length : 0);
    this.logger.log(`   🍪 Total cookies reçus: ${cookiesLength}`);
    this.logger.log(`   🍪 Cookies uniques détectés: ${uniqueCookieNames.length}`);
    this.logger.log(`   ✅ msToken: ${hasMsToken ? '✅ PRÉSENT' : '❌ MANQUANT (CRITIQUE !)'}`);
    this.logger.log(`   ✅ sessionid: ${hasSessionId ? '✅ PRÉSENT' : '❌ MANQUANT'}`);
    this.logger.log(`   ✅ sid_tt: ${hasSidTt ? '✅ PRÉSENT' : '❌ MANQUANT'}`);
    this.logger.log(`   ✅ sid_guard: ${hasSidGuard ? '✅ PRÉSENT' : '❌ MANQUANT'}`);
    this.logger.log(`   ✅ sid_ucp_v1: ${hasSidUcp ? '✅ PRÉSENT' : '❌ MANQUANT'}`);
    this.logger.log(`   ✅ uid_tt: ${hasUidTt ? '✅ PRÉSENT' : '❌ MANQUANT'}`);
    this.logger.log(`   ✅ ttwid: ${hasTtwid ? '✅ PRÉSENT' : '❌ MANQUANT'}`);
    this.logger.log(`${'='.repeat(80)}\n`);
    
    // Si msToken manque mais qu'on a les autres cookies essentiels, on continue avec un avertissement
    if (!hasMsToken) {
      if (hasMinimumEssential) {
        this.logger.warn('⚠️ [SERVICE] msToken MANQUANT mais autres cookies essentiels présents.');
        this.logger.warn('   💡 L\'agent IA peut fonctionner mais avec des limitations.');
        this.logger.warn('   💡 Pour une expérience optimale, capturez aussi les cookies depuis https://m.tiktok.com');
        this.logger.warn('   💡 Le cookie msToken peut être généré automatiquement lors de la navigation.');
        // On continue sans bloquer
      } else {
        // Pas assez de cookies essentiels
        this.logger.error('❌ [SERVICE] msToken MANQUANT et cookies essentiels insuffisants !');
        this.logger.error('   💡 Sans msToken ET sans les autres cookies essentiels, TikTok ne vous reconnaît pas.');
        this.logger.error('   💡 Solution : Dans DevTools, capturez les cookies depuis TOUS les domaines :');
        this.logger.error('      - https://tiktok.com');
        this.logger.error('      - https://www.tiktok.com');
        this.logger.error('      - https://m.tiktok.com');
        
        const missingCookies = [];
        if (!hasMsToken) missingCookies.push('msToken');
        if (!hasSessionId) missingCookies.push('sessionid');
        if (!hasSidTt) missingCookies.push('sid_tt');
        
        const errorMessage = `Cookies essentiels manquants: ${missingCookies.join(', ')}. ` +
          `Dans DevTools (F12 → Application → Cookies), capturez les cookies depuis TOUS les domaines: ` +
          `https://tiktok.com, https://www.tiktok.com, et https://m.tiktok.com. ` +
          `Assurez-vous de copier TOUS les cookies de chaque domaine.`;
        
        throw new Error(errorMessage);
      }
    }
    
    // Convertir les cookies parsés en format string[] pour validation et stockage
    const cookiesForValidation = parsedCookies.map(c => `${c.name}=${c.value}`);
    
    // Valider les cookies (non-bloquant si timeout)
    this.logger.log('🔍 [SERVICE] Validation des cookies...');
    
    // Vérifier d'abord si ce sont des cookies d'exemple
    const hasExampleCookies = cookieArray.some(c => 
      c.includes('sb-example') || c.includes('example') || c.includes('placeholder')
    );
    if (hasExampleCookies) {
      this.logger.error('❌ [SERVICE] Cookies d\'exemple détectés');
      throw new Error('Les cookies fournis sont des exemples/placeholders et ne sont pas valides. Veuillez vous reconnecter à TikTok pour obtenir de vrais cookies de session.');
    }
    
    // Valider les cookies avec timeout (non-bloquant)
    try {
      const isValid = await Promise.race([
        this.tiktokCookiesService.validateCookies(cookiesForValidation),
        new Promise<boolean>((resolve) => setTimeout(() => {
          this.logger.warn('⚠️ [SERVICE] Validation timeout après 20s, on continue quand même');
          resolve(false);
        }, 20000)), // Timeout après 20s
      ]);
      
      if (isValid) {
        this.logger.log('✅ [SERVICE] Cookies validés avec succès');
      } else {
        this.logger.warn('⚠️ [SERVICE] Validation des cookies échouée, mais on continue quand même');
      }
    } catch (error) {
      // En cas d'erreur, on continue quand même (sauf si ce sont des cookies d'exemple)
      this.logger.warn('⚠️ [SERVICE] Erreur lors de la validation, mais on continue:', error.message);
    }

    // Récupérer le username depuis le profil TikTok
    let username = 'tiktok_user';
    this.logger.log('🔍 [SERVICE] Récupération du username...');
    try {
      // Essayer d'abord de récupérer le username directement depuis le profil
      this.logger.log('👤 [SERVICE] Extraction du username depuis le profil @me...');
      const extractedUsername = await this.tiktokBrowserService.getUsername(parsedCookies);
      if (extractedUsername && extractedUsername !== 'me' && extractedUsername !== 'tiktok_user') {
        username = extractedUsername.trim();
        this.logger.log(`✅ [SERVICE] Username extrait depuis le profil: @${username}`);
      } else {
        // Fallback: essayer depuis les interactions
        this.logger.log('📊 [SERVICE] Fallback: Récupération des interactions pour obtenir le username...');
        const interactions = await this.tiktokBrowserService.getAllInteractions(parsedCookies);
        this.logger.log(`📊 [SERVICE] Interactions récupérées:`, {
          likes: interactions.likes?.length || 0,
          comments: interactions.comments?.length || 0,
          follows: interactions.follows?.length || 0
        });
        // Le username peut être dans les interactions
        if (interactions.follows && interactions.follows.length > 0) {
          username = interactions.follows[0].username || 'tiktok_user';
          this.logger.log(`✅ [SERVICE] Username trouvé dans les interactions: @${username}`);
        }
      }
    } catch (error) {
      // Si on ne peut pas récupérer, on continue avec le username par défaut
      this.logger.warn('⚠️ [SERVICE] Could not fetch username, using default:', error);
      console.error('❌ [SERVICE] Erreur lors de la récupération du username:', error);
    }
    
    // Nettoyer le username (enlever les espaces en début/fin, gérer les espaces)
    username = username.trim();
    this.logger.log(`👤 [SERVICE] Username final: @${username}`);

    // Vérifier si un compte existe déjà
    this.logger.log('🔍 [SERVICE] Vérification des comptes existants...');
    const existingAccount = await this.prisma.socialAccount.findFirst({
      where: {
        workspaceId,
        platform: 'tiktok',
      },
    });

    let accountId: string;

    if (existingAccount) {
      this.logger.log(`🔄 [SERVICE] Compte existant trouvé: ${existingAccount.id}, mise à jour...`);
      // Mettre à jour le compte existant
      // Si le username extrait est différent de 'tiktok_user', l'utiliser
      const finalUsername = (username && username !== 'tiktok_user') ? username : existingAccount.platformUsername;
      await this.prisma.socialAccount.update({
        where: { id: existingAccount.id },
        data: {
          scopes: [
            'browser_cookies',
            `cookies:${JSON.stringify(cookiesForValidation)}`,
          ],
          isActive: true,
          platformUsername: finalUsername, // Mettre à jour le username si on a réussi à l'extraire
        },
      });
      accountId = existingAccount.id;
      username = finalUsername; // Utiliser le username final (extrait ou existant)
      this.logger.log(`✅ [SERVICE] Updated existing TikTok account: ${accountId} with username: @${username}`);
    } else {
      this.logger.log('🆕 [SERVICE] Création d\'un nouveau compte TikTok...');
      // Créer un nouveau compte
      const newAccount = await this.prisma.socialAccount.create({
        data: {
          workspaceId,
          platform: 'tiktok',
          platformUserId: `user_${Date.now()}`,
          platformUsername: username,
          accessToken: 'browser_cookies',
          scopes: ['browser_cookies'],
          isActive: true,
        },
      });
      accountId = newAccount.id;
      this.logger.log(`✅ [SERVICE] Created new TikTok account: ${accountId} for @${username}`);
    }

    // Sauvegarder les cookies dans la table dédiée SocialSession
    await this.prisma.socialSession.upsert({
      where: { socialAccountId: accountId },
      update: {
        cookies: JSON.stringify(cookiesForValidation),
        lastActiveAt: new Date(),
      },
      create: {
        socialAccountId: accountId,
        cookies: JSON.stringify(cookiesForValidation),
      },
    });
    this.logger.log(`💾 [SERVICE] Session cookies saved to SocialSession table`);

    // Démarrer automatiquement le monitoring
    // 🤖 Démarrer l'agent IA automatiquement après la connexion
    // L'agent IA va observer TikTok avec la session de l'utilisateur
    try {
      this.logger.log(`🤖 [FlowIA] Starting AI Agent after TikTok connection...`);
      this.logger.log(`👁️ [FlowIA] Agent will observe TikTok every 5 minutes using user session`);
      await this.startTikTokMonitoring(accountId, cookiesForValidation, workspaceId);
    } catch (error) {
      this.logger.warn('Could not start TikTok AI Agent:', error);
    }

    // Collecter automatiquement les interactions après connexion
    this.logger.log('🔄 [SERVICE] Démarrage de la collecte automatique des interactions...');
    this.collectInteractionsAfterConnection(accountId).catch((error) => {
      this.logger.warn('⚠️ [SERVICE] Failed to collect interactions after TikTok cookie connection:', error);
    });

    this.logger.log(`✅ [SERVICE] TikTok account creation completed: ${accountId}`);
    
    return {
      accountId,
      username,
      cookies: cookiesForValidation,
      instructions: 'TikTok connecté avec succès. Le monitoring automatique a démarré.',
    };
    } finally {
      // Toujours retirer le verrou, même en cas d'erreur
      this.connectingWorkspaces.delete(workspaceId);
    }
  }

  /**
   * Capture les cookies TikTok après connexion manuelle de l'utilisateur (avec Playwright)
   * Crée automatiquement un compte social TikTok avec les cookies
   */
  async captureTikTokCookiesForWorkspace(workspaceId: string): Promise<{
    accountId: string;
    username: string;
    cookies: string[];
    instructions: string;
  }> {
    // Capturer les cookies et récupérer les infos du profil
    const result = await this.tiktokCookiesService.captureCookies(workspaceId);

    // Vérifier si un compte TikTok existe déjà pour ce workspace
    const existingAccount = await this.prisma.socialAccount.findFirst({
      where: {
        workspaceId,
        platform: 'tiktok',
        platformUsername: result.username,
      },
    });

    let accountId: string;

    if (existingAccount) {
      // Mettre à jour le compte existant
      await this.prisma.socialAccount.update({
        where: { id: existingAccount.id },
        data: {
          scopes: ['browser_cookies'],
          isActive: true,
        },
      });

      accountId = existingAccount.id;
    } else {
      // Créer un nouveau compte social TikTok
      const newAccount = await this.prisma.socialAccount.create({
        data: {
          workspaceId,
          platform: 'tiktok',
          platformUserId: result.userId,
          platformUsername: result.username,
          accessToken: 'browser_cookies',
          scopes: ['browser_cookies'],
          isActive: true,
        },
      });

      accountId = newAccount.id;
    }

    // Sauvegarder les cookies dans SocialSession (chiffrés)
    const encryptedCookies = this.encryptCookies(result.cookies);
    await this.prisma.socialSession.upsert({
      where: { socialAccountId: accountId },
      update: {
        cookies: encryptedCookies,
        lastActiveAt: new Date(),
      },
      create: {
        socialAccountId: accountId,
        cookies: encryptedCookies,
      },
    });

    // Démarrer automatiquement le monitoring après la capture des cookies
    try {
      await this.startTikTokMonitoring(accountId, result.cookies, workspaceId);
    } catch (error) {
      this.logger.warn('Could not start TikTok monitoring:', error);
    }

    return {
      accountId,
      username: result.username,
      cookies: result.cookies,
      instructions: result.instructions,
    };
  }

  /**
   * Démarre le monitoring automatique TikTok
   */
  async startTikTokMonitoring(
    accountId: string,
    cookies: string[],
    workspaceId: string,
    rules?: any,
  ): Promise<void> {
    // Règles par défaut : AGENT IA ACTIVÉ 🤖
    // L'agent IA observe TikTok automatiquement, analyse les interactions,
    // classe les leads et génère des messages personnalisés.
    // Les DM ne sont PAS envoyés automatiquement - l'utilisateur valide d'abord.
    const defaultRules = {
      autoReplyToComments: false, // Détecter mais ne pas envoyer de DM automatiquement
      autoReplyToLikes: false,
      autoReplyToFollows: false,
      autoReplyToMentions: false,
      minInteractionsBeforeDM: 3,
      aiEnabled: true, // ✅ Agent IA activé - Observe, analyse et génère des messages
      ...rules, // Permettre de surcharger les règles si besoin
    };

    this.logger.log(`🤖 [FlowIA] Starting AI Agent for account: ${accountId}`);
    this.logger.log(`👁️ [FlowIA] Agent will observe TikTok every 5 minutes, analyze interactions, and generate leads/messages`);
    await this.tiktokMonitorService.startMonitoring(
      accountId,
      cookies,
      workspaceId,
      defaultRules,
    );
    this.logger.log(`✅ [FlowIA] AI Agent started successfully - Your TikTok account is now being monitored by FlowIA`);
  }

  /**
   * Arrête le monitoring TikTok
   */
  async stopTikTokMonitoring(accountId: string): Promise<void> {
    this.tiktokMonitorService.stopMonitoring(accountId);
  }

  /**
   * Met à jour le username TikTok d'un compte existant
   */
  async updateTikTokUsername(accountId: string, workspaceId: string): Promise<{ username: string; success: boolean }> {
    this.logger.log(`🔄 [UPDATE] Mise à jour du username pour le compte: ${accountId}`);
    
    const account = await this.prisma.socialAccount.findFirst({
      where: {
        id: accountId,
        workspaceId,
        platform: 'tiktok',
      },
    });

    if (!account) {
      throw new Error('Compte TikTok non trouvé');
    }

    // Récupérer les cookies depuis la session
    const session = await this.prisma.socialSession.findUnique({
      where: { socialAccountId: accountId },
    });
    const cookies: string[] = session ? this.decryptCookies(session.cookies) : [];

    if (cookies.length === 0) {
      throw new Error('Aucun cookie trouvé pour ce compte');
    }

    // Extraire le username
    let username = 'tiktok_user';
    try {
      const extractedUsername = await this.tiktokBrowserService.getUsername(cookies);
      if (extractedUsername && extractedUsername !== 'tiktok_user') {
        username = extractedUsername;
        this.logger.log(`✅ [UPDATE] Username extrait: @${username}`);
      } else {
        this.logger.warn('⚠️ [UPDATE] Impossible d\'extraire le username, utilisation du username existant');
        return { username: account.platformUsername, success: false };
      }
    } catch (error) {
      this.logger.error('❌ [UPDATE] Erreur lors de l\'extraction du username:', error);
      return { username: account.platformUsername, success: false };
    }

    // Mettre à jour le compte
    await this.prisma.socialAccount.update({
      where: { id: accountId },
      data: {
        platformUsername: username,
      },
    });

    this.logger.log(`✅ [UPDATE] Username mis à jour: @${username}`);
    return { username, success: true };
  }

  /**
   * Déconnecte un compte social (arrête le monitoring et désactive le compte)
   */
  async disconnectAccount(accountId: string, workspaceId: string): Promise<{ message: string }> {
    this.logger.log(`🔌 [DISCONNECT] Disconnecting account: ${accountId} from workspace: ${workspaceId}`);

    const account = await this.prisma.socialAccount.findFirst({
      where: {
        id: accountId,
        workspaceId,
      },
    });

    if (!account) {
      throw new Error('Compte social non trouvé');
    }

    // Arrêter le monitoring si c'est TikTok
    if (account.platform === 'tiktok') {
      try {
        this.logger.log(`⏹️ [DISCONNECT] Stopping TikTok monitoring for account: ${accountId}`);
        this.stopTikTokMonitoring(accountId);
      } catch (error) {
        this.logger.warn(`⚠️ [DISCONNECT] Error stopping monitoring (may not be active):`, error);
      }
    }

    // Désactiver le compte au lieu de le supprimer (pour garder l'historique)
    await this.prisma.socialAccount.update({
      where: { id: accountId },
      data: {
        isActive: false,
        // Optionnel: vider les tokens/cookies pour plus de sécurité
        // accessToken: '',
        // refreshToken: null,
        // scopes: [],
      },
    });

    this.logger.log(`✅ [DISCONNECT] Account disconnected: ${accountId} (${account.platform})`);
    return {
      message: `Compte ${account.platform} déconnecté avec succès`,
    };
  }

  /**
   * Démarre le monitoring pour un compte existant
   */
  async startTikTokMonitoringForAccount(
    accountId: string,
    rules?: any,
  ): Promise<{ message: string }> {
    const account = await this.prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account || account.platform !== 'tiktok') {
      throw new Error('TikTok account not found');
    }

    // Récupérer et déchiffrer les cookies depuis la session
    const cookies = await this.getDecryptedCookies(accountId);

    if (cookies.length === 0) {
      throw new Error('TikTok cookies not found. Please reconnect your account.');
    }

    await this.startTikTokMonitoring(accountId, cookies, account.workspaceId, rules);

    return { message: 'TikTok monitoring started successfully' };
  }

  /**
   * Vérifie le statut du monitoring
   */
  getTikTokMonitoringStatus(accountId: string): { isMonitoring: boolean } {
    const isActive = this.tiktokMonitorService.isMonitoring(accountId);
    return { isMonitoring: isActive };
  }

  /**
   * Vérifie le statut de la capture de cookies TikTok
   */
  async getTikTokCaptureStatus(workspaceId: string): Promise<{
    hasAccount: boolean;
    accountId?: string;
    username?: string;
    cookiesValid?: boolean;
  }> {
    const account = await this.prisma.socialAccount.findFirst({
      where: {
        workspaceId,
        platform: 'tiktok',
      },
    });

    if (!account) {
      return { hasAccount: false };
    }

    // Vérifier si les cookies sont valides via la session
    const session = await this.prisma.socialSession.findUnique({
      where: { socialAccountId: account.id },
    });
    
    const cookies: string[] = session ? this.decryptCookies(session.cookies) : [];

    let cookiesValid = false;
    if (cookies.length > 0) {
      cookiesValid = await this.tiktokCookiesService.validateCookies(cookies);
    }

    return {
      hasAccount: true,
      accountId: account.id,
      username: account.platformUsername,
      cookiesValid,
    };
  }

  /**
   * Ancienne méthode (gardée pour compatibilité)
   */
  async captureTikTokCookies(accountId: string): Promise<{
    cookies: string[];
    instructions: string;
  }> {
    const account = await this.prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const result = await this.tiktokCookiesService.captureCookies(account.workspaceId);

    if (account) {
      const updatedScopes = [
        ...(account.scopes || []),
        'browser_cookies',
        `cookies:${JSON.stringify(result.cookies)}`,
      ];

      await this.prisma.socialAccount.update({
        where: { id: accountId },
        data: {
          scopes: updatedScopes,
        },
      });
    }

    return {
      cookies: result.cookies,
      instructions: result.instructions,
    };
  }

  async getTikTokComments(accountId: string, videoId: string) {
    const accessToken = await this.getDecryptedToken(accountId);
    return this.tiktokService.getVideoComments(accessToken, videoId);
  }

  async replyToTikTokComment(accountId: string, commentId: string, text: string) {
    const accessToken = await this.getDecryptedToken(accountId);
    return this.tiktokService.replyToComment(accessToken, commentId, text);
  }

  async sendTikTokDm(
    accountId: string,
    username: string,
    message: string,
    workspaceId: string,
  ) {
    const account = await this.prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error('TikTok account not found');
    }

    const session = await this.prisma.socialSession.findUnique({
      where: { socialAccountId: accountId },
    });
    const cookies: string[] = session ? this.decryptCookies(session.cookies) : [];

    if (cookies.length === 0) {
      throw new Error(
        'TikTok cookies not configured. Please connect your TikTok account and enable browser automation.',
      );
    }

    return this.tiktokBrowserService.sendDm(username, message, cookies, workspaceId);
  }

  /**
   * Récupère toutes les interactions TikTok via scraping
   * Utilise les cookies de session de l'utilisateur connecté
   */
  async getTikTokInteractions(accountId: string): Promise<{
    likes: any[];
    comments: any[];
    follows: any[];
    shares: any[];
    mentions: any[];
  }> {
    const account = await this.prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error('TikTok account not found');
    }

    // Récupérer les cookies de session
    const session = await this.prisma.socialSession.findUnique({
      where: { socialAccountId: accountId },
    });
    const cookies: string[] = session ? this.decryptCookies(session.cookies) : [];

    if (cookies.length === 0) {
      throw new Error('TikTok cookies not configured. Please connect your TikTok account.');
    }

    return this.tiktokBrowserService.getAllInteractions(cookies);
  }

  /**
   * Récupère les messages TikTok via scraping
   */
  async getTikTokMessages(accountId: string): Promise<any[]> {
    const account = await this.prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error('TikTok account not found');
    }

    const session = await this.prisma.socialSession.findUnique({
      where: { socialAccountId: accountId },
    });
    const cookies: string[] = session ? this.decryptCookies(session.cookies) : [];

    if (cookies.length === 0) {
      throw new Error('TikTok cookies not configured.');
    }

    return this.tiktokBrowserService.getMessages(cookies);
  }

  /**
   * Récupère les followers récents
   */
  async getTikTokFollowers(accountId: string): Promise<any[]> {
    const account = await this.prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error('TikTok account not found');
    }

    const session = await this.prisma.socialSession.findUnique({
      where: { socialAccountId: accountId },
    });
    const cookies: string[] = session ? this.decryptCookies(session.cookies) : [];

    if (cookies.length === 0) {
      throw new Error('TikTok cookies not configured.');
    }

    return this.tiktokBrowserService.getRecentFollowers(cookies);
  }

  /**
   * Collecte automatiquement les interactions après la connexion d'un compte
   * Cette méthode est appelée de manière asynchrone pour ne pas bloquer la connexion
   */
  private async collectInteractionsAfterConnection(accountId: string): Promise<void> {
    this.logger.log(`🔄 [COLLECT] Scheduling interaction collection for account: ${accountId}`);
    this.logger.log(`🔄 [COLLECT] InteractionsService available: ${!!this.interactionsService}`);
    
    // Utiliser setTimeout pour exécuter de manière asynchrone et éviter de bloquer
    setTimeout(async () => {
      try {
        this.logger.log(`⏰ [COLLECT] Starting interaction collection for account: ${accountId}`);
        
        if (!this.interactionsService) {
          this.logger.error(`❌ [COLLECT] InteractionsService is null/undefined for account: ${accountId}`);
          // Essayer de récupérer le service via l'injection
          this.logger.log(`🔄 [COLLECT] Attempting to get InteractionsService from module...`);
          return;
        }
        
        this.logger.log(`✅ [COLLECT] InteractionsService found, calling collectInteractionsForAccount...`);
        const result = await this.interactionsService.collectInteractionsForAccount(accountId);
        this.logger.log(`✅ [COLLECT] Interactions collected for account: ${accountId}`, {
          collected: result.collected,
          created: result.created,
        });
      } catch (error) {
        this.logger.error(`❌ [COLLECT] Failed to collect interactions for account ${accountId}:`, error);
        this.logger.error(`❌ [COLLECT] Error details:`, error.stack);
      }
      }, 2000); // Attendre 2 secondes après la connexion
  }

  /**
   * 🆕 Initie une connexion TikTok via QR code
   */
  async initiateTikTokQRConnection(workspaceId: string): Promise<{
    connectionId: string;
    qrCodeBase64: string;
    expiresAt: Date;
  }> {
    this.logger.log(`🔐 [QR] Initiation connexion QR TikTok pour workspace: ${workspaceId}`);
    return this.tiktokQRConnectionService.initiateQRConnection(workspaceId);
  }

  /**
   * 🆕 Récupère le statut d'une connexion QR
   */
  async getTikTokQRConnectionStatus(connectionId: string): Promise<{
    status: string;
    username?: string;
    error?: string;
    expiresAt?: Date;
  }> {
    const state = this.tiktokQRConnectionService.getConnectionStatus(connectionId);
    if (!state) {
      throw new Error('Connexion QR introuvable ou expirée');
    }

    return {
      status: state.status,
      username: state.username,
      error: state.error,
      expiresAt: state.expiresAt,
    };
  }

  /**
   * 🆕 Complète une connexion QR et crée le compte TikTok
   */
  async completeTikTokQRConnection(
    connectionId: string,
    workspaceId: string,
  ): Promise<{
    accountId: string;
    username: string;
    cookies: string[];
    instructions: string;
  }> {
    this.logger.log(`✅ [QR] Finalisation connexion QR ${connectionId} pour workspace: ${workspaceId}`);

    // Récupérer les cookies de la connexion QR
    const connectionData = await this.tiktokQRConnectionService.getConnectionCookies(connectionId);
    if (!connectionData) {
      throw new Error('Connexion QR non complétée ou expirée');
    }

    // Convertir les cookies en format string[] pour compatibilité
    const cookies = connectionData.cookies.map((c) => `${c.name}=${c.value}`);

    // Créer le compte TikTok avec les cookies récupérés
    const result = await this.createTikTokAccountFromCookies(workspaceId, cookies);

    // Fermer la connexion QR
    await this.tiktokQRConnectionService.closeConnection(connectionId);

    this.logger.log(`✅ [QR] Compte TikTok créé via QR code: @${result.username}`);

    return result;
  }
}

