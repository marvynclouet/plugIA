#!/bin/bash
# Script pour générer des icônes placeholder pour l'extension

# Créer les icônes avec ImageMagick si disponible, sinon utiliser une solution simple
if command -v convert &> /dev/null; then
  # Générer des icônes avec ImageMagick
  convert -size 16x16 xc:#667eea -pointsize 10 -fill white -gravity center -annotate +0+0 "P" icons/icon16.png
  convert -size 48x48 xc:#667eea -pointsize 24 -fill white -gravity center -annotate +0+0 "P" icons/icon48.png
  convert -size 128x128 xc:#667eea -pointsize 64 -fill white -gravity center -annotate +0+0 "P" icons/icon128.png
  echo "✅ Icônes générées avec ImageMagick"
else
  # Créer des fichiers SVG simples
  echo '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="#667eea"/><text x="8" y="12" font-size="10" fill="white" text-anchor="middle">P</text></svg>' > icons/icon16.svg
  echo '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="#667eea"/><text x="24" y="32" font-size="24" fill="white" text-anchor="middle">P</text></svg>' > icons/icon48.svg
  echo '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#667eea"/><text x="64" y="88" font-size="64" fill="white" text-anchor="middle">P</text></svg>' > icons/icon128.svg
  echo "⚠️  ImageMagick non trouvé. Icônes SVG créées. Vous devrez les convertir en PNG manuellement."
  echo "💡 Vous pouvez utiliser un outil en ligne comme https://cloudconvert.com/svg-to-png"
fi

