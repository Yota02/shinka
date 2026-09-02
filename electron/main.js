const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Éditeur d\'arbres phylogénétiques',
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function saveFileToSystem(defaultName, filters, data) {
  dialog
    .showSaveDialog(mainWindow, {
      defaultPath: defaultName,
      filters,
    })
    .then((result) => {
      if (!result.canceled && result.filePath) {
        fs.writeFileSync(result.filePath, data);
      }
    })
    .catch((err) => {
      console.error(err);
      dialog.showErrorBox('Erreur', 'Impossible de sauvegarder le fichier : ' + err.message);
    });
}

function buildMenu() {
  const template = [
    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Exporter en SVG',
          click: () => {
            mainWindow.webContents.send('export-request', 'svg');
          },
        },
        {
          label: 'Exporter en PNG',
          click: () => {
            mainWindow.webContents.send('export-request', 'png');
          },
        },
        { type: 'separator' },
        {
          label: 'Exporter en Newick',
          click: () => {
            mainWindow.webContents.send('export-request', 'newick');
          },
        },
        { type: 'separator' },
        {
          label: 'Quitter',
          role: 'quit',
        },
      ],
    },
    {
      label: 'Affichage',
      submenu: [
        { role: 'reload', label: 'Recharger' },
        { role: 'toggleDevTools', label: 'Outils de développement' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom par défaut' },
        { role: 'zoomIn', label: 'Agrandir' },
        { role: 'zoomOut', label: 'Réduire' },
      ],
    },
    {
      label: 'Édition',
      role: 'editMenu',
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

ipcMain.on('save-file', (event, payload) => {
  saveFileToSystem(payload.defaultName, payload.filters, payload.data);
});

app.whenReady().then(() => {
  createWindow();
  buildMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
