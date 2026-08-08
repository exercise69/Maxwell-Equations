# Maxwell-Equations

**Feldnotizen** — eine einseitige Erklär-Website zu den vier Maxwellschen Gleichungen:
Vektoranalysis-Grundlagen (Gradient, Divergenz, Rotation), die vier Gleichungen in
differentieller und integraler Form mit ihrer physikalischen Bedeutung, und die
Ableitung der Wellengleichung, die zeigt, warum Licht eine elektromagnetische Welle ist.

Eine Kopie dieser Seite lebt auch als privates Claude-Artifact:
https://claude.ai/code/artifact/d4637528-4c76-4ae2-9a6b-8e863b89b172

## Ansehen

- **Lokal**: `index.html` direkt im Browser öffnen — keine Abhängigkeiten, kein Build-Schritt.
- **Online (GitHub Pages)**: unter *Settings → Pages → Deploy from a branch* den
  Branch `main` und Ordner `/ (root)` auswählen. Danach ist die Seite unter
  `https://exercise69.github.io/maxwell-equations/` erreichbar.

## Inhalt

| Abschnitt | Inhalt |
|---|---|
| Hero | Animierte ebene elektromagnetische Welle (E ⟂ B ⟂ Ausbreitungsrichtung) |
| Werkzeug | Gradient, Divergenz, Rotation; Gaußscher & Stokesscher Integralsatz |
| Die Gleichungen | Gaußsches Gesetz (E), Gaußsches Gesetz (B), Faraday, Ampère-Maxwell |
| Die Konsequenz | Herleitung der Wellengleichung, c = 1/√(μ₀ε₀) |
| Nachschlagen | Größen & SI-Einheiten |

Reines HTML/CSS/JS in einer Datei, keine externen Ressourcen (kein CDN, keine Fonts,
keine Bibliotheken) — funktioniert offline und passt sich automatisch an helles/dunkles
Farbschema an.
