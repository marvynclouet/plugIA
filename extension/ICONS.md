# Génération des icônes

L'extension nécessite 3 icônes PNG :
- `icons/icon16.png` (16x16px)
- `icons/icon48.png` (48x48px)
- `icons/icon128.png` (128x128px)

## Option 1 : Utiliser un générateur en ligne

1. Allez sur https://www.favicon-generator.org/ ou https://realfavicongenerator.net/
2. Téléchargez une icône ou créez-en une
3. Téléchargez les différentes tailles
4. Placez-les dans le dossier `icons/`

## Option 2 : Utiliser ImageMagick

```bash
# Installer ImageMagick (macOS)
brew install imagemagick

# Générer les icônes
convert -size 16x16 xc:#667eea -pointsize 10 -fill white -gravity center -annotate +0+0 "P" icons/icon16.png
convert -size 48x48 xc:#667eea -pointsize 24 -fill white -gravity center -annotate +0+0 "P" icons/icon48.png
convert -size 128x128 xc:#667eea -pointsize 64 -fill white -gravity center -annotate +0+0 "P" icons/icon128.png
```

## Option 3 : Créer manuellement

Créez 3 images carrées avec :
- Fond : #667eea (violet)
- Texte : "P" en blanc, centré
- Tailles : 16x16, 48x48, 128x128 pixels

## Icônes temporaires

Pour tester rapidement, vous pouvez utiliser n'importe quelle image PNG et la redimensionner aux bonnes tailles.

