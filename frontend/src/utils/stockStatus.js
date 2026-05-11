export function getStockStatus(produit) {
  const quantite = Number(produit?.quantite) || 0;
  const seuilMin = Number(produit?.seuil_min) || 0;

  if (quantite <= 0) {
    return {
      key: 'out',
      label: 'Rupture',
      shortLabel: 'Rupture',
      color: 'var(--danger)',
      bg: 'var(--danger-alpha-8)',
      border: 'var(--danger-alpha-12)',
      pulse: true,
    };
  }

  if (seuilMin > 0 && quantite <= seuilMin) {
    return {
      key: 'low',
      label: 'Stock faible',
      shortLabel: 'Faible',
      color: 'var(--warning)',
      bg: 'var(--warning-alpha-8)',
      border: 'var(--warning-alpha-12)',
      pulse: false,
    };
  }

  return {
    key: 'ok',
    label: 'Stock normal',
    shortLabel: 'Normal',
    color: 'var(--success)',
    bg: 'var(--success-alpha-8)',
    border: 'var(--success-alpha-12)',
    pulse: false,
  };
}
