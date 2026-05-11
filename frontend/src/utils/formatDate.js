// Petits helpers de formatage de dates utilises dans l'UI (profil, dashboard, etc.)

/**
 * Renvoie une version relative en francais, type "il y a 2 heures".
 * Pour les dates anciennes (> 7 jours), on retombe sur un format complet.
 */
export function timeAgoFr(dateInput) {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;

  const diffMs = Date.now() - date.getTime();
  const seconds = Math.round(diffMs / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 45) return "a l'instant";
  if (minutes < 2) return 'il y a 1 minute';
  if (minutes < 60) return `il y a ${minutes} minutes`;
  if (hours < 2) return 'il y a 1 heure';
  if (hours < 24) return `il y a ${hours} heures`;
  if (days === 1) return 'hier';
  if (days < 7) return `il y a ${days} jours`;

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format lisible "12 mai 2026 a 14:32"
 */
export function formatDateTimeFr(dateInput) {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;
  return (
    date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    + ' a '
    + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  );
}
