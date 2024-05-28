require('dotenv').config();
const express = require('express');
const ftp = require('ftp');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware pour analyser les requêtes POST
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use('/Assets', express.static(path.join(__dirname, 'Assets')));

// Configuration FTP classique
const ftpConfigSource = {
  host: process.env.FTP_SOURCE_HOST,
  user: process.env.FTP_SOURCE_USER,
  password: process.env.FTP_SOURCE_PASSWORD,
  secure: false
};

// Configuration FTPS
const ftpConfig = {
  host: process.env.FTPS_HOST,
  user: process.env.FTPS_USER,
  password: process.env.FTPS_PASSWORD,
  secure: true,
  port: 21
};

// Configuration du deuxième serveur FTP
const ftpConfigSecond = {
  host: process.env.SECOND_FTP_HOST,
  user: process.env.SECOND_FTP_USER,
  password: process.env.SECOND_FTP_PASSWORD,
  secure: false
};

// Route pour la page d'accueil
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

function connectToFtp(config) {
  return new Promise((resolve, reject) => {
    const client = new ftp();
    client.on('ready', () => resolve(client));
    client.on('error', err => reject(err));
    client.connect(config);
  });
}

// Route pour explorer le contenu du serveur source
app.get('/ftp-source/:chemin?', async (req, res) => {
  const cheminDossier = req.params.chemin || '';
  try {
    const client = await connectToFtp(ftpConfigSource);
    client.list(cheminDossier, (err, listeFichiers) => {
      if (err) {
        console.error('Erreur lors de la récupération du contenu du dossier:', err);
        res.status(500).send('Erreur lors de la récupération du contenu du dossier.');
      } else {
        const fichiers = listeFichiers
          .filter(fichier => (fichier.type === 'd' || fichier.name.endsWith('.mp4') || fichier.name.endsWith('.jpg')) && fichier.name !== '.' && fichier.name !== '..')
          .map(fichier => ({
            name: fichier.name,
            type: fichier.type === 'd' ? 'dossier' : 'fichier'
          }));
        res.json(fichiers);
      }
      client.end();
    });
  } catch (error) {
    console.error('Erreur lors de la connexion au serveur FTP source:', error);
    res.status(500).send('Erreur lors de la connexion au serveur FTP source.');
  }
});

// Route pour le traitement du transfert
app.post('/transfert', async (req, res) => {
  const fichierSource = req.body.fichier;
  const destination = req.body.destination;

  let ftpConfigDestination;

  if (destination === 'shutterstock') {
    ftpConfigDestination = ftpConfig;
  } else if (destination === 'pond5') {
    ftpConfigDestination = ftpConfigSecond;
  } else {
    res.status(400).send('Destination inconnue.');
    return;
  }

  try {
    const clientSource = await connectToFtp(ftpConfigSource);
    const clientDestination = await connectToFtp(ftpConfigDestination);

    clientSource.get(fichierSource, (err, stream) => {
      if (err) {
        console.error('Erreur lors de la récupération du fichier:', err);
        res.status(500).send('Erreur lors de la récupération du fichier.');
      } else {
        const buffers = [];

        stream.on('data', data => {
          buffers.push(data);
        });

        stream.on('end', () => {
          const buffer = Buffer.concat(buffers);
          clientDestination.put(buffer, path.basename(fichierSource), err => {
            if (err) {
              console.error('Erreur lors du transfert du fichier:', err);
              res.status(500).send('Erreur lors du transfert du fichier.');
            } else {
              res.json({ message: 'Fichier transféré avec succès!', fichier: path.basename(fichierSource) });
            }
            clientSource.end();
            clientDestination.end();
          });
        });
      }
    });
  } catch (error) {
    console.error('Erreur lors du transfert du fichier:', error);
    res.status(500).send('Erreur lors du transfert du fichier.');
  }
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur en écoute sur le port ${port}`);
});
