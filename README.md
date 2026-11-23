# Meine Tafel

Digitale Tafel für den Unterricht (Klasse 1–6).

- `docs/` – Web-Version (wird über GitHub Pages veröffentlicht, installierbar als Chrome-App)
- `app/` – Windows-App (Electron), nutzt denselben Code aus `docs/`

## Windows-App bauen
```
cd app
npm install
npm run dist
```
Der Installer liegt danach in `dist/`.
