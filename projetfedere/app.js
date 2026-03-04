/* =====================================================================
   app.js — Logique frontend avec fetch API (aucune donnée statique)
   ===================================================================== */

'use strict';

// Utilisateur connecté (rempli après login)
let currentUser = null;

// Projets chargés depuis l'API
let allProjects = [];

// ── Mapping statut BDD → label affiché ──────────────────────────────
const STATUT_LABELS = {
  propose:  'Proposé',
  valide:   'Validé',
  en_cours: 'En cours',
  soutenu:  'Soutenu',
  refuse:   'Refusé',
};

// ── Mapping statut → classe CSS ─────────────────────────────────────
const STATUT_CLASSES = {
  propose:  'status-Proposé',
  valide:   'status-Validé',
  en_cours: 'status-En-cours',
  soutenu:  'status-Soutenu',
  refuse:   'status-Refusé',
};

// ====================================================================
// AUTHENTIFICATION
// ====================================================================

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errEl    = document.getElementById('login-error');
  const btnText  = document.getElementById('login-btn-text');
  const spinner  = document.getElementById('login-spinner');

  errEl.textContent = '';

  if (!email || !password) {
    errEl.textContent = 'Veuillez remplir tous les champs.';
    shake(document.getElementById('login-form'));
    return;
  }

  btnText.textContent = 'Connexion…';
  spinner.classList.remove('hidden');
  document.getElementById('login-btn').disabled = true;

  try {
    const res = await fetch('api/auth.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, mot_de_passe: password }),
    });

    const data = await res.json();

    if (!res.ok) {
      errEl.textContent = data.erreur || 'Identifiants incorrects.';
      shake(document.getElementById('login-form'));
      return;
    }

    currentUser = data;
    showDashboard();
  } catch {
    errEl.textContent = 'Erreur réseau. Vérifiez votre connexion.';
    shake(document.getElementById('login-form'));
  } finally {
    btnText.textContent = 'Se connecter';
    spinner.classList.add('hidden');
    document.getElementById('login-btn').disabled = false;
  }
});

async function logout() {
  try {
    await fetch('api/auth.php', { method: 'DELETE', credentials: 'same-origin' });
  } catch { /* ignorer les erreurs réseau lors du logout */ }
  currentUser  = null;
  allProjects  = [];
  document.getElementById('dashboard-page').classList.remove('active');
  document.getElementById('login-page').classList.add('active');
  document.getElementById('email').value    = '';
  document.getElementById('password').value = '';
  document.getElementById('login-error').textContent = '';
}

// ====================================================================
// DASHBOARD
// ====================================================================

async function showDashboard() {
  document.getElementById('login-page').classList.remove('active');
  document.getElementById('dashboard-page').classList.add('active');

  document.getElementById('user-name').textContent =
    escapeHtml(currentUser.prenom + ' ' + currentUser.nom);
  document.getElementById('user-role-badge').textContent =
    capitalize(currentUser.role);

  // Afficher le bouton "Nouveau projet" seulement pour les étudiants
  const newBtn = document.getElementById('new-project-btn');
  if (currentUser.role === 'etudiant') {
    newBtn.classList.remove('hidden');
  } else {
    newBtn.classList.add('hidden');
  }

  await loadProjects();
  loadNotifications();
}

// ====================================================================
// PROJETS
// ====================================================================

async function loadProjects() {
  const grid         = document.getElementById('projects-grid');
  const emptyState   = document.getElementById('empty-state');
  const loadingState = document.getElementById('loading-state');

  grid.innerHTML = '';
  emptyState.classList.add('hidden');
  loadingState.classList.remove('hidden');

  try {
    const res = await fetch('api/projets.php', { credentials: 'same-origin' });

    if (res.status === 401) {
      logout();
      return;
    }

    if (!res.ok) throw new Error('Erreur serveur');

    allProjects = await res.json();
  } catch {
    showToast('Impossible de charger les projets.', 'error');
    allProjects = [];
  } finally {
    loadingState.classList.add('hidden');
  }

  updateStats();
  renderProjects(allProjects);
}

function renderProjects(projects) {
  const grid       = document.getElementById('projects-grid');
  const emptyState = document.getElementById('empty-state');

  grid.innerHTML = '';

  if (projects.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  projects.forEach((p) => {
    const label   = STATUT_LABELS[p.statut]  || capitalize(p.statut);
    const cssClass = STATUT_CLASSES[p.statut] || 'status-Proposé';

    // Technologies stockées en string séparée par des virgules
    const techList = p.technologies
      ? p.technologies.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const techHTML = techList
      .map((t) => `<span class="tech-tag">${escapeHtml(t)}</span>`)
      .join('');

    // Participants selon le rôle
    let participantsHTML = '';
    if (p.etudiant_nom) {
      participantsHTML += `<span>👤 ${escapeHtml(p.etudiant_prenom + ' ' + p.etudiant_nom)}</span>`;
    }
    if (p.tuteur_nom) {
      participantsHTML += `<span>🧑‍🏫 ${escapeHtml(p.tuteur_prenom + ' ' + p.tuteur_nom)}</span>`;
    }

    const typeLabel = p.type_projet === 'entreprise' ? '🏢 Entreprise' : '🎓 Académique';

    const card = document.createElement('article');
    card.className = 'project-card';
    card.innerHTML = `
      <div class="card-header">
        <span class="card-title">${escapeHtml(p.titre)}</span>
        <span class="status-badge ${cssClass}">${escapeHtml(label)}</span>
      </div>
      <p class="card-desc">${escapeHtml(p.description)}</p>
      ${techList.length ? `<div class="tech-tags">${techHTML}</div>` : ''}
      <div class="card-meta">
        <span>${typeLabel}</span>
        <span>📅 ${formatDate(p.date_soumission)}</span>
        ${participantsHTML}
      </div>
    `;
    grid.appendChild(card);
  });
}

function updateStats() {
  const bar = document.getElementById('stats-bar');

  const counts = {
    total:    allProjects.length,
    propose:  allProjects.filter((p) => p.statut === 'propose').length,
    valide:   allProjects.filter((p) => p.statut === 'valide').length,
    en_cours: allProjects.filter((p) => p.statut === 'en_cours').length,
    soutenu:  allProjects.filter((p) => p.statut === 'soutenu').length,
    refuse:   allProjects.filter((p) => p.statut === 'refuse').length,
  };

  bar.innerHTML = `
    <div class="stat-card"><div class="stat-value">${counts.total}</div><div class="stat-label">Total</div></div>
    <div class="stat-card"><div class="stat-value">${counts.propose}</div><div class="stat-label">Proposés</div></div>
    <div class="stat-card"><div class="stat-value">${counts.valide}</div><div class="stat-label">Validés</div></div>
    <div class="stat-card"><div class="stat-value">${counts.en_cours}</div><div class="stat-label">En cours</div></div>
    <div class="stat-card"><div class="stat-value">${counts.soutenu}</div><div class="stat-label">Soutenus</div></div>
  `;
}

function filterProjects() {
  const query  = document.getElementById('search-input').value.toLowerCase().trim();
  const statut = document.getElementById('filter-statut').value;
  const type   = document.getElementById('filter-type').value;

  const filtered = allProjects.filter((p) => {
    const matchSearch = !query
      || p.titre.toLowerCase().includes(query)
      || p.description.toLowerCase().includes(query)
      || (p.technologies && p.technologies.toLowerCase().includes(query));
    const matchStatut = !statut || p.statut === statut;
    const matchType   = !type   || p.type_projet === type;
    return matchSearch && matchStatut && matchType;
  });

  renderProjects(filtered);
}

// ====================================================================
// MODAL — NOUVEAU PROJET
// ====================================================================

function openModal() {
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('project-form').reset();
  document.getElementById('project-form-error').textContent = '';
  document.getElementById('entreprise-group').style.display = 'none';
  document.getElementById('proj-titre').focus();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

function closeModalOutside(event) {
  if (event.target === document.getElementById('modal-overlay')) {
    closeModal();
  }
}

// Afficher/masquer le champ entreprise selon le type
document.getElementById('proj-type').addEventListener('change', function () {
  document.getElementById('entreprise-group').style.display =
    this.value === 'entreprise' ? 'block' : 'none';
});

document.getElementById('project-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl   = document.getElementById('project-form-error');
  const btnText = document.getElementById('submit-btn-text');
  const spinner = document.getElementById('submit-spinner');

  errEl.textContent = '';

  const titre       = document.getElementById('proj-titre').value.trim();
  const description = document.getElementById('proj-description').value.trim();
  const type        = document.getElementById('proj-type').value;
  const technologies = document.getElementById('proj-technologies').value.trim();
  const nomEntreprise = document.getElementById('proj-entreprise').value.trim();

  if (!titre || !description) {
    errEl.textContent = 'Le titre et la description sont obligatoires.';
    shake(document.getElementById('project-form'));
    return;
  }

  btnText.textContent = 'Envoi…';
  spinner.classList.remove('hidden');

  try {
    const payload = { titre, description, type_projet: type };
    if (technologies) payload.technologies = technologies;
    if (nomEntreprise) payload.nom_entreprise = nomEntreprise;

    const res = await fetch('api/projets.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      errEl.textContent = data.erreur || 'Erreur lors de la création du projet.';
      shake(document.getElementById('project-form'));
      return;
    }

    closeModal();
    showToast('Projet soumis avec succès !', 'success');
    await loadProjects();
  } catch {
    errEl.textContent = 'Erreur réseau. Veuillez réessayer.';
    shake(document.getElementById('project-form'));
  } finally {
    btnText.textContent = 'Soumettre';
    spinner.classList.add('hidden');
  }
});

// ====================================================================
// NOTIFICATIONS
// ====================================================================

async function loadNotifications() {
  try {
    const res = await fetch('api/notifications.php', { credentials: 'same-origin' });
    if (!res.ok) return;
    const notifs = await res.json();

    const badge    = document.getElementById('notif-badge');
    const list     = document.getElementById('notif-list');
    const dropdown = document.getElementById('notif-dropdown');

    list.innerHTML = '';

    if (notifs.length === 0) {
      badge.classList.add('hidden');
      const li = document.createElement('li');
      li.textContent = 'Aucune nouvelle notification.';
      li.style.color = '#64748b';
      list.appendChild(li);
    } else {
      badge.textContent = notifs.length;
      badge.classList.remove('hidden');
      notifs.forEach((n) => {
        const li = document.createElement('li');
        li.textContent = n.message;
        li.title = formatDate(n.date_envoi);
        li.addEventListener('click', () => markNotifRead(n.id, li));
        list.appendChild(li);
      });
    }

    // Fermer le dropdown en cliquant ailleurs
    document.addEventListener('click', closeDropdownOutside, { once: true });
    dropdown.classList.remove('hidden');
  } catch { /* ignorer */ }
}

function closeDropdownOutside(e) {
  const wrapper = document.getElementById('notif-btn').closest('.notif-wrapper');
  if (!wrapper.contains(e.target)) {
    document.getElementById('notif-dropdown').classList.add('hidden');
  } else {
    // Re-attacher si le clic était dans le wrapper
    document.addEventListener('click', closeDropdownOutside, { once: true });
  }
}

async function markNotifRead(id, li) {
  try {
    await fetch('api/notifications.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ id }),
    });
    li.style.opacity = '0.4';
    li.style.pointerEvents = 'none';
  } catch { /* ignorer */ }
}

// ====================================================================
// UTILITAIRES
// ====================================================================

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  return isNaN(d.getTime())
    ? str
    : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function togglePassword() {
  const input = document.getElementById('password');
  input.type = input.type === 'password' ? 'text' : 'password';
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className   = 'toast ' + type;
  toast.classList.remove('hidden');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.add('hidden'), 3500);
}

function shake(el) {
  el.classList.remove('shake');
  el.offsetWidth; // Trigger reflow to restart CSS animation
  el.classList.add('shake');
}
