/**
 * Parser pour cookies TikTok au format spécifique
 * 
 * Formats supportés:
 * 1. Format brut collé depuis DevTools (tabulaire sans séparateurs)
 *    Exemple: sid_ttf734eaa...82f.tiktok.com/2026-05-22T23:23:10.785Z38✓✓Medium
 * 
 * 2. Format tabulaire (tab-separated)
 *    Exemple: sid_tt\tf734eaa...82f\t.tiktok.com\t/\t2026-05-22T23:23:10.785Z
 * 
 * 3. Format standard (name=value)
 *    Exemple: sid_tt=f734eaa...82f; Domain=.tiktok.com; Path=/
 * 
 * 4. Format array de strings
 *    Exemple: ["sid_tt=f734eaa...82f", "sessionid=xyz..."]
 */

import { Cookie } from 'playwright';

interface ParsedCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

/**
 * Parse un cookie brut au format TikTok (collé depuis DevTools)
 * Format: name[VALUE].tiktok.com/[EXPIRY][SIZE]✓✓[SAMESITE][PRIORITY]
 * 
 * Exemple: sid_ttf734eaa29312e33f9ddcbf935948b82f.tiktok.com/2026-05-22T23:23:10.785Z38✓✓Medium
 */
function parseTikTokCookieFormat(rawCookie: string): ParsedCookie | null {
  try {
    // Pattern pour détecter le format: name[VALUE].tiktok.com/[EXPIRY]...
    // On cherche le pattern: [nom][valeur].tiktok.com/[date]
    const tiktokDomainPattern = /\.tiktok\.com\//;
    const match = rawCookie.match(tiktokDomainPattern);
    
    if (!match) {
      return null; // Pas un cookie TikTok au format brut
    }

    const domainIndex = match.index!;
    const beforeDomain = rawCookie.substring(0, domainIndex);
    const afterDomain = rawCookie.substring(domainIndex + match[0].length);

    // Trouver où commence le nom du cookie (avant la valeur)
    // Les noms de cookies TikTok connus
    const knownCookieNames = [
      'sid_tt', 'sid_ucp_v1', 'ssid_ucp_v1', 'sessionid', 'mstoken', 'msToken',
      'ttwid', 'uid_tt', 'uid_tt_ss', 'sid_guard', 'tt_csrf_token', 'tt_chain_token',
      'store-country-code', 'store-country-code-src', 'store-country-sign', 'store-idc',
      'tiktok_webapp_theme', 'tiktok_webapp_theme_source', 'tt_session_tlb_tag',
      'tt-target-idc', 'tt-target-idc-sign'
    ];

    let cookieName = '';
    let cookieValue = '';
    let nameStartIndex = 0;

    // Chercher le nom du cookie en partant du début
    for (const knownName of knownCookieNames) {
      if (beforeDomain.startsWith(knownName)) {
        cookieName = knownName;
        cookieValue = beforeDomain.substring(knownName.length);
        nameStartIndex = knownName.length;
        break;
      }
    }

    // Si aucun nom connu trouvé, essayer de deviner (prendre les premiers caractères jusqu'à un pattern)
    if (!cookieName) {
      // Chercher un pattern comme "name" suivi d'une valeur (souvent alphanumérique)
      const nameMatch = beforeDomain.match(/^([a-z_]+[a-z0-9_]*)/i);
      if (nameMatch) {
        cookieName = nameMatch[1];
        cookieValue = beforeDomain.substring(cookieName.length);
      } else {
        // Fallback: prendre tout avant .tiktok.com comme valeur, et deviner le nom
        cookieValue = beforeDomain;
        cookieName = 'unknown_cookie';
      }
    }

    // Parser la date d'expiration (format ISO: 2026-05-22T23:23:10.785Z)
    let expires = -1; // Session cookie par défaut
    const dateMatch = afterDomain.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/);
    if (dateMatch) {
      try {
        const expiryDate = new Date(dateMatch[1]);
        expires = Math.floor(expiryDate.getTime() / 1000);
      } catch (e) {
        // Ignore invalid date
      }
    }

    // Détecter SameSite (✓✓ = Lax, ✓ = Strict, None = None)
    let sameSite: 'Strict' | 'Lax' | 'None' = 'Lax';
    if (afterDomain.includes('None')) {
      sameSite = 'None';
    } else if (afterDomain.includes('Strict')) {
      sameSite = 'Strict';
    }

    // Détecter Secure (présence de ✓ après la date)
    const secure = afterDomain.includes('✓');

    return {
      name: cookieName,
      value: cookieValue,
      domain: '.tiktok.com',
      path: '/',
      expires,
      httpOnly: false, // Par défaut
      secure,
      sameSite,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Parse une chaîne de cookies bruts collés (format DevTools)
 * Les cookies sont collés ensemble sans séparateurs clairs
 */
export function parseTikTokCookies(rawCookies: string): Cookie[] {
  const cookies: Cookie[] = [];
  
  if (!rawCookies || rawCookies.trim().length === 0) {
    return cookies;
  }

  // Liste des noms de cookies TikTok connus pour aider à la séparation
  const knownCookieNames = [
    'sid_tt', 'sid_ucp_v1', 'ssid_ucp_v1', 'sessionid', 'mstoken', 'msToken',
    'ttwid', 'uid_tt', 'uid_tt_ss', 'sid_guard', 'tt_csrf_token', 'tt_chain_token',
    'store-country-code', 'store-country-code-src', 'store-country-sign', 'store-idc',
    'tiktok_webapp_theme', 'tiktok_webapp_theme_source', 'tt_session_tlb_tag',
    'tt-target-idc', 'tt-target-idc-sign'
  ];

  // Stratégie 1: Chercher les patterns ".tiktok.com/" pour séparer les cookies
  const cookiePattern = /([a-z_][a-z0-9_]*[^.]*\.tiktok\.com\/[^a-z_]*)/gi;
  const matches = rawCookies.matchAll(cookiePattern);
  
  const foundCookies: string[] = [];
  for (const match of matches) {
    foundCookies.push(match[1]);
  }

  // Si on n'a pas trouvé de pattern, essayer de séparer par les noms de cookies connus
  if (foundCookies.length === 0) {
    let remaining = rawCookies;
    for (const knownName of knownCookieNames) {
      const regex = new RegExp(`(${knownName}[^a-z_]*\.tiktok\.com\/[^a-z_]*)`, 'gi');
      const match = remaining.match(regex);
      if (match) {
        foundCookies.push(match[0]);
        remaining = remaining.replace(match[0], '');
      }
    }
  }

  // Parser chaque cookie trouvé
  for (const cookieStr of foundCookies) {
    const parsed = parseTikTokCookieFormat(cookieStr);
    if (parsed && parsed.name && parsed.value) {
      cookies.push({
        name: parsed.name,
        value: parsed.value,
        domain: parsed.domain || '.tiktok.com',
        path: parsed.path || '/',
        expires: parsed.expires || -1,
        httpOnly: parsed.httpOnly || false,
        secure: parsed.secure !== undefined ? parsed.secure : true,
        sameSite: parsed.sameSite || 'Lax',
      });
    }
  }

  return cookies;
}

/**
 * Parse un array de cookies (format string[])
 * Supporte plusieurs formats: "name=value", "name=value; Domain=...", format tabulaire, etc.
 */
export function parseCookiesArray(cookieStrings: string[]): Cookie[] {
  const cookies: Cookie[] = [];

  for (const cookieStr of cookieStrings) {
    if (!cookieStr || cookieStr.trim().length === 0) {
      continue;
    }

    // Format tabulaire (tab-separated)
    if (cookieStr.includes('\t')) {
      const parts = cookieStr.split('\t');
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const value = parts[1].trim();
        cookies.push({
          name,
          value: decodeURIComponent(value),
          domain: '.tiktok.com',
          path: '/',
          expires: -1,
          httpOnly: false,
          secure: true,
          sameSite: 'Lax',
        });
      }
      continue;
    }

    // Format standard "name=value" ou "name=value; Domain=..."
    const [nameValue, ...attributes] = cookieStr.split(';');
    if (nameValue && nameValue.includes('=')) {
      const [name, ...valueParts] = nameValue.split('=');
      const value = valueParts.join('='); // En cas de = dans la valeur

      const cookie: Cookie = {
        name: name.trim(),
        value: decodeURIComponent(value.trim()),
        domain: '.tiktok.com',
        path: '/',
        expires: -1,
        httpOnly: false,
        secure: true,
        sameSite: 'Lax',
      };

      // Parser les attributs additionnels
      for (const attr of attributes) {
        const [key, val] = attr.split('=');
        const keyTrim = key.trim().toLowerCase();
        if (keyTrim === 'domain') {
          cookie.domain = val?.trim() || '.tiktok.com';
        } else if (keyTrim === 'path') {
          cookie.path = val?.trim() || '/';
        } else if (keyTrim === 'httponly') {
          cookie.httpOnly = true;
        } else if (keyTrim === 'secure') {
          cookie.secure = true;
        } else if (keyTrim === 'samesite') {
          cookie.sameSite = (val?.trim() || 'Lax') as 'Lax' | 'Strict' | 'None';
        } else if (keyTrim === 'expires') {
          try {
            const expiryDate = new Date(val?.trim() || '');
            cookie.expires = Math.floor(expiryDate.getTime() / 1000);
          } catch (e) {
            // Ignore invalid date
          }
        }
      }

      cookies.push(cookie);
    }
  }

  return cookies;
}

/**
 * Parse les cookies depuis n'importe quel format (string brut, string[], ou Cookie[])
 * C'est la fonction principale à utiliser
 */
export function parseCookiesForPlaywright(
  cookies: string | string[] | Cookie[],
): Cookie[] {
  // Si déjà en format Cookie[], retourner tel quel (avec normalisation)
  if (Array.isArray(cookies) && cookies.length > 0 && typeof cookies[0] !== 'string') {
    return (cookies as Cookie[]).map((c) => ({
      ...c,
      domain: c.domain || '.tiktok.com',
      path: c.path || '/',
      expires: c.expires || -1,
      value: c.value ? decodeURIComponent(c.value) : c.value,
    }));
  }

  // Si c'est une string unique (format brut collé)
  if (typeof cookies === 'string') {
    // Essayer d'abord le format brut TikTok
    const parsed = parseTikTokCookies(cookies);
    if (parsed.length > 0) {
      return parsed;
    }
    // Sinon, traiter comme un array avec un seul élément
    return parseCookiesArray([cookies]);
  }

  // Si c'est un array de strings
  if (Array.isArray(cookies) && cookies.length > 0 && typeof cookies[0] === 'string') {
    // Si c'est un seul string long (format brut collé), essayer de le parser
    if (cookies.length === 1 && cookies[0].length > 200) {
      const parsed = parseTikTokCookies(cookies[0]);
      if (parsed.length > 0) {
        return parsed;
      }
    }
    // Sinon, parser comme array normal
    return parseCookiesArray(cookies as string[]);
  }

  return [];
}


