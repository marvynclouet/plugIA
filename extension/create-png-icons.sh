#!/bin/bash
# Créer des PNG simples avec sips (macOS)

cd icons

# Créer des PNG temporaires depuis les SVG en utilisant sips
# sips ne supporte pas SVG directement, donc on crée des PNG simples

# Pour icon16.png (16x16)
sips -s format png --out icon16.png -z 16 16 <<EOF2
