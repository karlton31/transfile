const contenuDossierSource = document.getElementById("contenu-dossier-source");
    const formTransfert = document.getElementById("form-transfert");
    const statusDiv = document.getElementById("status");
    const fileQueue = document.getElementById("file-queue");
    const queueDiv = document.getElementById("queue");
    const startButton = document.getElementById("start-button");
    const emptyQueueButton = document.getElementById("empty-queue-button");

    let queue = [];

    formTransfert.onsubmit = function(event) {
      event.preventDefault();
      startTransfer();
    };

    emptyQueueButton.onclick = function() {
      queue = [];
      updateQueueDisplay();
    };

    function explorerDossierSource(chemin = '') {
      fetch(`/ftp-source${chemin ? '/' + encodeURIComponent(chemin) : ''}`, {
        method: 'GET'
      })
      .then(response => response.json())
      .then(data => {
        contenuDossierSource.innerHTML = ''; // Efface le contenu précédent
        if (chemin !== '') {
          // Ajouter un lien pour revenir en arrière
          const lienRetour = document.createElement('a');
          lienRetour.href = `#`;
          lienRetour.textContent = 'Retour';
          lienRetour.classList.add('btn', 'btn-success', 'back-button', 'list-group-item-action');
          lienRetour.onclick = (event) => {
            event.preventDefault(); // Empêche le saut vers le haut de la page
            const cheminParent = chemin.split('/').slice(0, -1).join('/');
            explorerDossierSource(cheminParent);
          };
          contenuDossierSource.appendChild(lienRetour);
        }
        data.forEach(fichier => {
          const lien = document.createElement('div');
          lien.classList.add('list-group-item', 'file-item');
        
          const fileName = document.createElement('div');
          fileName.classList.add('file-name');
          const icon = document.createElement('img');
          icon.classList.add('icon');
          if (fichier.type === 'dossier') {
            icon.src = 'https://cdn.glitch.global/1a4a7390-2176-4c11-87c6-968a33007394/folder.png?v=1716908759028';
          } else {
            icon.src = 'https://cdn.glitch.global/1a4a7390-2176-4c11-87c6-968a33007394/video.png?v=1716908762458';
          }
        
          const fileText = document.createElement('span');
          fileText.textContent = fichier.name;
          fileName.appendChild(icon);
          fileName.appendChild(fileText);
        
          const fileSize = document.createElement('span');
          if (fichier.type !== 'dossier') {
            fileSize.textContent = ` (${(fichier.size / (1024 * 1024)).toFixed(2)} MB)`;
          } else {
            fileSize.textContent = '';
          }
        
          fileName.appendChild(fileSize);
        
          const btnGroup = document.createElement('div');
          btnGroup.classList.add('btn-group');

          if (fichier.type !== 'dossier') {
            const btnSS = document.createElement('button');
            btnSS.classList.add('btn', 'btn-secondary', 'no-pointer');
            btnSS.textContent = 'Send to SS';
            btnSS.onclick = (event) => {
              event.stopPropagation();
              addToQueue(`${chemin}/${fichier.name}`, 'shutterstock');
            };
            const btnPond5 = document.createElement('button');
            btnPond5.classList.add('btn', 'btn-secondary', 'no-pointer');
            btnPond5.textContent = 'Send to Pond5';
            btnPond5.onclick = (event) => {
              event.stopPropagation();
              addToQueue(`${chemin}/${fichier.name}`, 'pond5');
            };
            const btnAdobeStock = document.createElement('button');
            btnAdobeStock.classList.add('btn', 'btn-secondary', 'no-pointer');
            btnAdobeStock.textContent = 'Send to Adobe Stock';
            btnAdobeStock.onclick = (event) => {
              event.stopPropagation();
              addToQueue(`${chemin}/${fichier.name}`, 'adobestock');
            };

            btnGroup.appendChild(btnSS);
            btnGroup.appendChild(btnPond5);
            btnGroup.appendChild(btnAdobeStock);
            lien.appendChild(fileName);
            lien.appendChild(btnGroup);
          } else {
            const btnSendAllSS = document.createElement('button');
            btnSendAllSS.classList.add('btn', 'btn-secondary', 'ml-3');
            btnSendAllSS.textContent = 'Send All to SS';
            btnSendAllSS.onclick = (event) => {
              event.stopPropagation();
              addAllVideosToQueue(`${chemin}/${fichier.name}`, 'shutterstock');
            };
            const btnSendAllPond5 = document.createElement('button');
            btnSendAllPond5.classList.add('btn', 'btn-secondary', 'ml-3');
            btnSendAllPond5.textContent = 'Send All to Pond5';
            btnSendAllPond5.onclick = (event) => {
              event.stopPropagation();
              addAllVideosToQueue(`${chemin}/${fichier.name}`, 'pond5');
            };
            const btnSendAllAdobeStock = document.createElement('button');
            btnSendAllAdobeStock.classList.add('btn', 'btn-secondary', 'ml-3');
            btnSendAllAdobeStock.textContent = 'Send All to Adobe Stock';
            btnSendAllAdobeStock.onclick = (event) => {
              event.stopPropagation();
              addAllVideosToQueue(`${chemin}/${fichier.name}`, 'adobestock');
            };

            btnGroup.appendChild(btnSendAllSS);
            btnGroup.appendChild(btnSendAllPond5);
            btnGroup.appendChild(btnSendAllAdobeStock);
            lien.appendChild(fileName);
            lien.appendChild(btnGroup);
            lien.onclick = (event) => {
              event.preventDefault(); // Empêche le saut vers le haut de la page
              explorerDossierSource(`${chemin}/${fichier.name}`);
            };
          }

          contenuDossierSource.appendChild(lien);
        });
      })
      .catch(error => {
        console.error('Erreur lors de la connexion au serveur FTP source:', error);
        contenuDossierSource.innerHTML = 'Erreur lors de la connexion au serveur FTP source.';
      });
    }

    function addToQueue(fichier, destination) {
      queue.push({ fichier, destination });
      updateQueueDisplay();
    }

    function addAllVideosToQueue(chemin, destination) {
      fetch(`/ftp-source/${encodeURIComponent(chemin)}`, {
        method: 'GET'
      })
      .then(response => response.json())
      .then(data => {
        data.forEach(fichier => {
          if (fichier.type !== 'dossier' && (fichier.name.endsWith('.mp4'))) {
            queue.push({ fichier: `${chemin}/${fichier.name}`, destination });
          }
        });
        updateQueueDisplay();
      })
      .catch(error => {
        console.error('Erreur lors de la connexion au serveur FTP source:', error);
        alert('Erreur lors de la connexion au serveur FTP source.');
      });
    }

    function updateQueueDisplay() {
      fileQueue.innerHTML = '';
      if (queue.length === 0) {
        queueDiv.style.display = 'none';
      } else {
        queueDiv.style.display = 'block';
        queue.forEach((item, index) => {
          const listItem = document.createElement('li');
          listItem.classList.add('list-group-item', 'queue-item');
          listItem.textContent = `${item.fichier} (${item.destination})`;

          const btnRemove = document.createElement('button');
          btnRemove.classList.add('btn', 'btn-danger', 'ml-3');
          btnRemove.textContent = 'Remove';
          btnRemove.onclick = () => {
            queue.splice(index, 1);
            updateQueueDisplay();
          };

          listItem.appendChild(btnRemove);
          fileQueue.appendChild(listItem);
        });
      }
    }

    function startTransfer() {
      if (queue.length === 0) {
        statusDiv.textContent = 'No files in queue to transfer.';
        return;
      }

      startButton.textContent = 'In Progress';
      startButton.disabled = true;

      const item = queue.shift();
      updateQueueDisplay();

      statusDiv.textContent = `Transferring file: ${item.fichier}`;

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/transfert", true);
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

      xhr.onload = function() {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          statusDiv.textContent = `${response.message} - ${response.fichier}`;
        } else {
          statusDiv.textContent = "Error during file transfer.";
        }
      };

      xhr.onerror = function() {
        statusDiv.textContent = "Error during file transfer.";
      };

      xhr.send(`fichier=${encodeURIComponent(item.fichier)}&destination=${encodeURIComponent(item.destination)}`);

      // Automatically start the next transfer after the current one completes
      xhr.onloadend = function() {
        if (queue.length > 0) {
          startTransfer();
        } else {
          startButton.textContent = 'Start';
          startButton.disabled = false;
          statusDiv.textContent = 'All files transferred successfully.';
        }
      };
    }

// Afficher ou masquer le bouton en fonction du scroll
window.onscroll = function() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
      scrollToTopBtn.style.display = "block";
    } else {
      scrollToTopBtn.style.display = "none";
    }
  };
  
  // Ajouter un événement au clic pour le bouton de retour en haut
  scrollToTopBtn.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });



explorerDossierSource();
