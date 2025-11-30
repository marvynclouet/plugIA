// Popup script pour l'extension PlugIA

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Éléments DOM
const loginForm = document.getElementById('login-form') as HTMLElement;
const statusDiv = document.getElementById('status') as HTMLElement;
const emailInput = document.getElementById('email') as HTMLInputElement;
const passwordInput = document.getElementById('password') as HTMLInputElement;
const loginBtn = document.getElementById('login-btn') as HTMLButtonElement;
const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement;
const statusText = document.getElementById('status-text') as HTMLElement;

// Vérifier l'état de connexion au chargement
async function checkAuthStatus(): Promise<void> {
  const { authToken } = await chrome.storage.sync.get(['authToken']);

  if (authToken) {
    // Vérifier si le token est valide
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const user = await response.json();
        showLoggedIn(user);
      } else {
        // Token invalide, supprimer
        await chrome.storage.sync.remove(['authToken']);
        showLoggedOut();
      }
    } catch (err) {
      console.error('Auth check error:', err);
      showLoggedOut();
    }
  } else {
    showLoggedOut();
  }
}

function showLoggedIn(user: any): void {
  loginForm.style.display = 'none';
  statusDiv.style.display = 'block';
  if (statusText) {
    statusText.textContent = `Connecté en tant que ${user.email || user.name || 'Utilisateur'}`;
  }
}

function showLoggedOut(): void {
  loginForm.style.display = 'block';
  statusDiv.style.display = 'none';
}

// Gestionnaire de connexion
loginBtn?.addEventListener('click', async () => {
  const email = emailInput?.value;
  const password = passwordInput?.value;

  if (!email || !password) {
    alert('Veuillez remplir tous les champs');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur de connexion');
    }

    const data = await response.json();
    
    // Sauvegarder le token
    await chrome.storage.sync.set({ authToken: data.access_token });

    // Afficher le statut connecté
    showLoggedIn(data.user);

    // Fermer le popup après 1 seconde
    setTimeout(() => {
      window.close();
    }, 1000);
  } catch (err: any) {
    alert(`Erreur: ${err.message}`);
  }
});

// Gestionnaire de déconnexion
logoutBtn?.addEventListener('click', async () => {
  await chrome.storage.sync.remove(['authToken']);
  showLoggedOut();
  emailInput.value = '';
  passwordInput.value = '';
});

// Vérifier l'état au chargement
checkAuthStatus();

