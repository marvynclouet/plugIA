#!/usr/bin/env node

/**
 * 🔄 Convertisseur de cookies TikTok
 * 
 * Convertit les cookies au format tabulaire (DevTools) vers le format attendu par FlowIA
 * 
 * Usage:
 *   node convert-tiktok-cookies.js < input.txt > output.json
 *   ou collez les cookies directement dans le script
 */

const readline = require('readline');

// Format d'entrée attendu (tabulaire depuis DevTools):
// name    value    domain    path    expires    size    httpOnly    secure    sameSite    priority

function parseTabularCookies(input) {
  const lines = input.trim().split('\n');
  const cookies = [];
  
  for (const line of lines) {
    if (!line.trim() || line.startsWith('#')) continue;
    
    // Séparer par tabulation
    const parts = line.split('\t');
    
    if (parts.length < 2) {
      // Essayer avec des espaces multiples
      const spacedParts = line.split(/\s{2,}/);
      if (spacedParts.length >= 2) {
        const name = spacedParts[0].trim();
        const value = spacedParts[1].trim();
        if (name && value) {
          cookies.push(`${name}=${value}`);
        }
      }
    } else {
      const name = parts[0].trim();
      const value = parts[1].trim();
      if (name && value) {
        cookies.push(`${name}=${value}`);
      }
    }
  }
  
  return cookies;
}

// Si des arguments sont fournis, traiter directement
if (process.argv.length > 2) {
  const input = process.argv.slice(2).join('\n');
  const cookies = parseTabularCookies(input);
  console.log(JSON.stringify(cookies, null, 2));
  process.exit(0);
}

// Sinon, lire depuis stdin
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

let input = '';

rl.on('line', (line) => {
  input += line + '\n';
});

rl.on('close', () => {
  const cookies = parseTabularCookies(input);
  console.log(JSON.stringify(cookies, null, 2));
});



