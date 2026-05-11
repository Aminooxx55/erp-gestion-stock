// Script pour ajouter des données réalistes au projet
require('dotenv').config();
const { sequelize } = require('./src/config/db');
const db = require('./src/models');
const { v4: uuidv4 } = require('uuid');

const seed = async () => {
  await sequelize.authenticate();
  console.log('Connecte a la base.');

  // Trouver l'admin existant pour les mouvements
  const admin = await db.User.findOne({ where: { role: 'admin' } });
  if (!admin) { console.log('Aucun admin trouve!'); process.exit(1); }
  console.log(`Admin: ${admin.prenom} ${admin.nom}`);

  // ── CATÉGORIES ──
  const cats = [
    { nom: 'Informatique', description: 'Matériel informatique et accessoires' },
    { nom: 'Fournitures Bureau', description: 'Papeterie, classeurs et consommables bureau' },
    { nom: 'Mobilier', description: 'Bureaux, chaises et armoires' },
    { nom: 'Électronique', description: 'Composants et équipements électroniques' },
    { nom: 'Nettoyage', description: 'Produits d\'entretien et hygiène' },
    { nom: 'Sécurité', description: 'Équipements de protection et sécurité' },
  ];

  const catMap = {};
  for (const c of cats) {
    const [cat] = await db.Categorie.findOrCreate({ where: { nom: c.nom }, defaults: c });
    catMap[c.nom] = cat.id;
    console.log(`  Cat: ${c.nom}`);
  }

  // ── PRODUITS ──
  const produits = [
    // Informatique
    { code: 'INF-001', nom: 'Ordinateur Dell OptiPlex', description: 'PC bureau Dell OptiPlex 7010, i5, 16Go RAM', unite: 'piece', quantite: 12, seuil_min: 5, cat: 'Informatique' },
    { code: 'INF-002', nom: 'Écran Samsung 27"', description: 'Moniteur Full HD 27 pouces', unite: 'piece', quantite: 8, seuil_min: 3, cat: 'Informatique' },
    { code: 'INF-003', nom: 'Clavier Logitech K120', description: 'Clavier USB filaire', unite: 'piece', quantite: 25, seuil_min: 10, cat: 'Informatique' },
    { code: 'INF-004', nom: 'Souris sans fil', description: 'Souris optique sans fil Logitech M185', unite: 'piece', quantite: 30, seuil_min: 10, cat: 'Informatique' },
    { code: 'INF-005', nom: 'Câble HDMI 2m', description: 'Câble HDMI haute vitesse 2 mètres', unite: 'piece', quantite: 18, seuil_min: 5, cat: 'Informatique' },
    { code: 'INF-006', nom: 'Clé USB 64Go', description: 'Clé USB 3.0 SanDisk 64Go', unite: 'piece', quantite: 40, seuil_min: 15, cat: 'Informatique' },
    { code: 'INF-007', nom: 'Imprimante HP LaserJet', description: 'Imprimante laser monochrome', unite: 'piece', quantite: 3, seuil_min: 2, cat: 'Informatique' },

    // Fournitures Bureau
    { code: 'FRN-001', nom: 'Ramette Papier A4', description: 'Papier blanc 80g/m², 500 feuilles', unite: 'ramette', quantite: 45, seuil_min: 20, cat: 'Fournitures Bureau' },
    { code: 'FRN-002', nom: 'Stylo Bic Bleu', description: 'Stylo bille cristal bleu, boîte de 50', unite: 'boite', quantite: 15, seuil_min: 5, cat: 'Fournitures Bureau' },
    { code: 'FRN-003', nom: 'Classeur A4', description: 'Classeur à levier dos 80mm', unite: 'piece', quantite: 60, seuil_min: 20, cat: 'Fournitures Bureau' },
    { code: 'FRN-004', nom: 'Agrafeuse', description: 'Agrafeuse de bureau 24/6', unite: 'piece', quantite: 8, seuil_min: 3, cat: 'Fournitures Bureau' },
    { code: 'FRN-005', nom: 'Cartouche Toner HP', description: 'Toner noir compatible HP LaserJet', unite: 'piece', quantite: 6, seuil_min: 4, cat: 'Fournitures Bureau' },
    { code: 'FRN-006', nom: 'Post-it 76x76mm', description: 'Notes adhésives jaunes, lot de 12', unite: 'lot', quantite: 10, seuil_min: 3, cat: 'Fournitures Bureau' },

    // Mobilier
    { code: 'MOB-001', nom: 'Bureau droit 160cm', description: 'Bureau plan droit avec caisson', unite: 'piece', quantite: 5, seuil_min: 2, cat: 'Mobilier' },
    { code: 'MOB-002', nom: 'Chaise de bureau', description: 'Chaise ergonomique avec accoudoirs', unite: 'piece', quantite: 10, seuil_min: 3, cat: 'Mobilier' },
    { code: 'MOB-003', nom: 'Armoire métallique', description: 'Armoire 2 portes, hauteur 180cm', unite: 'piece', quantite: 3, seuil_min: 1, cat: 'Mobilier' },
    { code: 'MOB-004', nom: 'Caisson 3 tiroirs', description: 'Caisson mobile à roulettes', unite: 'piece', quantite: 7, seuil_min: 2, cat: 'Mobilier' },

    // Électronique
    { code: 'ELC-001', nom: 'Multiprise parafoudre', description: 'Multiprise 6 prises avec protection', unite: 'piece', quantite: 14, seuil_min: 5, cat: 'Électronique' },
    { code: 'ELC-002', nom: 'Onduleur APC 700VA', description: 'Onduleur Back-UPS 700VA', unite: 'piece', quantite: 4, seuil_min: 2, cat: 'Électronique' },
    { code: 'ELC-003', nom: 'Switch réseau 8 ports', description: 'Switch Ethernet Gigabit 8 ports', unite: 'piece', quantite: 3, seuil_min: 1, cat: 'Électronique' },
    { code: 'ELC-004', nom: 'Câble RJ45 Cat6 3m', description: 'Câble réseau catégorie 6, 3 mètres', unite: 'piece', quantite: 35, seuil_min: 10, cat: 'Électronique' },

    // Nettoyage
    { code: 'NET-001', nom: 'Savon liquide 5L', description: 'Savon mains antibactérien', unite: 'bidon', quantite: 8, seuil_min: 3, cat: 'Nettoyage' },
    { code: 'NET-002', nom: 'Papier toilette', description: 'Rouleau maxi, lot de 48', unite: 'lot', quantite: 4, seuil_min: 2, cat: 'Nettoyage' },
    { code: 'NET-003', nom: 'Détergent sol 5L', description: 'Nettoyant multi-surfaces parfum citron', unite: 'bidon', quantite: 6, seuil_min: 3, cat: 'Nettoyage' },
    { code: 'NET-004', nom: 'Sac poubelle 100L', description: 'Sacs résistants, rouleau de 25', unite: 'rouleau', quantite: 12, seuil_min: 5, cat: 'Nettoyage' },

    // Sécurité
    { code: 'SEC-001', nom: 'Extincteur CO2', description: 'Extincteur 5kg CO2', unite: 'piece', quantite: 6, seuil_min: 4, cat: 'Sécurité' },
    { code: 'SEC-002', nom: 'Gilet haute visibilité', description: 'Gilet jaune fluo EN471', unite: 'piece', quantite: 15, seuil_min: 5, cat: 'Sécurité' },
    { code: 'SEC-003', nom: 'Casque de chantier', description: 'Casque de protection blanc', unite: 'piece', quantite: 0, seuil_min: 5, cat: 'Sécurité' },
    { code: 'SEC-004', nom: 'Gants de protection', description: 'Gants latex taille L, boîte de 100', unite: 'boite', quantite: 2, seuil_min: 3, cat: 'Sécurité' },
  ];

  const prodMap = {};
  for (const p of produits) {
    const [prod] = await db.Produit.findOrCreate({
      where: { code: p.code },
      defaults: {
        nom: p.nom, description: p.description, unite: p.unite,
        quantite: p.quantite, seuil_min: p.seuil_min,
        categorie_id: catMap[p.cat],
      },
    });
    prodMap[p.code] = prod;
    console.log(`  Produit: ${p.code} — ${p.nom} (${p.quantite} ${p.unite})`);
  }

  // ── MOUVEMENTS DE STOCK ──
  // Mouvements réalistes sur les 30 derniers jours
  const mouvements = [
    // Semaine 1 — Réception commande fournisseur
    { code: 'INF-001', type: 'entree', qty: 20, motif: 'Réception commande Dell #CMD-2026-0301', days: 28 },
    { code: 'INF-002', type: 'entree', qty: 15, motif: 'Réception commande Samsung #CMD-2026-0302', days: 28 },
    { code: 'FRN-001', type: 'entree', qty: 100, motif: 'Réapprovisionnement papeterie mensuel', days: 27 },
    { code: 'FRN-002', type: 'entree', qty: 30, motif: 'Réapprovisionnement papeterie mensuel', days: 27 },
    { code: 'NET-001', type: 'entree', qty: 15, motif: 'Commande produits entretien', days: 26 },
    { code: 'NET-004', type: 'entree', qty: 20, motif: 'Commande produits entretien', days: 26 },

    // Semaine 1 — Sorties
    { code: 'INF-001', type: 'sortie', qty: 3, motif: 'Installation 3 postes — Dept. Comptabilité', days: 25 },
    { code: 'INF-002', type: 'sortie', qty: 3, motif: 'Installation écrans — Dept. Comptabilité', days: 25 },
    { code: 'INF-003', type: 'sortie', qty: 3, motif: 'Accessoires postes Comptabilité', days: 25 },
    { code: 'FRN-001', type: 'sortie', qty: 10, motif: 'Distribution mensuelle — Étage 1', days: 24 },
    { code: 'FRN-003', type: 'sortie', qty: 8, motif: 'Distribution classeurs — Archives', days: 24 },

    // Semaine 2
    { code: 'MOB-002', type: 'entree', qty: 8, motif: 'Réception mobilier — Fournisseur OfficePro', days: 21 },
    { code: 'MOB-001', type: 'entree', qty: 4, motif: 'Réception mobilier — Fournisseur OfficePro', days: 21 },
    { code: 'SEC-003', type: 'entree', qty: 10, motif: 'Commande EPI chantier B', days: 20 },
    { code: 'ELC-004', type: 'entree', qty: 50, motif: 'Réapprovisionnement câblage réseau', days: 19 },
    { code: 'INF-006', type: 'sortie', qty: 5, motif: 'Distribution clés USB — Formation RH', days: 18 },
    { code: 'FRN-005', type: 'sortie', qty: 2, motif: 'Remplacement toner — Imprimante RDC', days: 18 },
    { code: 'NET-002', type: 'sortie', qty: 2, motif: 'Réassort sanitaires étage 2', days: 17 },

    // Semaine 3
    { code: 'INF-001', type: 'sortie', qty: 5, motif: 'Renouvellement postes — Dept. RH', days: 14 },
    { code: 'INF-002', type: 'sortie', qty: 4, motif: 'Écrans pour salle de réunion', days: 14 },
    { code: 'MOB-002', type: 'sortie', qty: 5, motif: 'Aménagement nouveau bureau open-space', days: 13 },
    { code: 'MOB-004', type: 'sortie', qty: 3, motif: 'Aménagement nouveau bureau open-space', days: 13 },
    { code: 'FRN-001', type: 'sortie', qty: 15, motif: 'Distribution mensuelle — Tous les étages', days: 12 },
    { code: 'FRN-002', type: 'sortie', qty: 8, motif: 'Distribution stylos — Accueil + RH', days: 12 },
    { code: 'SEC-002', type: 'sortie', qty: 6, motif: 'Équipement visiteurs chantier', days: 11 },
    { code: 'SEC-003', type: 'sortie', qty: 10, motif: 'Distribution casques — Chantier B', days: 11 },
    { code: 'ELC-001', type: 'entree', qty: 10, motif: 'Commande multiprises bureau', days: 10 },
    { code: 'ELC-002', type: 'entree', qty: 3, motif: 'Onduleurs pour salle serveur', days: 10 },

    // Semaine 4 — Activité récente
    { code: 'FRN-001', type: 'sortie', qty: 20, motif: 'Commande urgente Direction Générale', days: 7 },
    { code: 'INF-004', type: 'sortie', qty: 8, motif: 'Remplacement souris défectueuses', days: 6 },
    { code: 'NET-003', type: 'sortie', qty: 3, motif: 'Nettoyage de printemps — Tous les étages', days: 5 },
    { code: 'NET-001', type: 'sortie', qty: 5, motif: 'Réassort distributeurs savon', days: 5 },
    { code: 'FRN-004', type: 'sortie', qty: 2, motif: 'Remplacement agrafeuses cassées', days: 4 },
    { code: 'INF-005', type: 'sortie', qty: 4, motif: 'Câblage salle de conférence', days: 3 },
    { code: 'SEC-004', type: 'sortie', qty: 3, motif: 'Distribution gants — Équipe maintenance', days: 3 },
    { code: 'ELC-004', type: 'sortie', qty: 12, motif: 'Câblage réseau — Nouveau bâtiment', days: 2 },
    { code: 'FRN-006', type: 'sortie', qty: 4, motif: 'Distribution post-it — Réunion projet', days: 1 },
    { code: 'INF-007', type: 'sortie', qty: 1, motif: 'Déplacement imprimante — Étage 3', days: 1 },
    { code: 'FRN-001', type: 'entree', qty: 50, motif: 'Réapprovisionnement urgent papier A4', days: 0 },
    { code: 'SEC-004', type: 'entree', qty: 5, motif: 'Réception commande gants #CMD-2026-0412', days: 0 },
  ];

  let count = 0;
  for (const m of mouvements) {
    const prod = prodMap[m.code];
    if (!prod) continue;

    const date = new Date();
    date.setDate(date.getDate() - m.days);
    date.setHours(8 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60));

    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const ref = `MVT-${dateStr}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    await db.MouvementStock.create({
      produit_id: prod.id,
      type: m.type,
      quantite: m.qty,
      motif: m.motif,
      reference: ref,
      effectue_par: admin.id,
      date_mouvement: date,
    });
    count++;
  }
  console.log(`\n${count} mouvements créés.`);

  // Mettre à jour les quantités des produits existants (PC-002, Laptop ASUS, etc.)
  // en gardant les valeurs définies dans le tableau produits ci-dessus
  // (les findOrCreate n'ont pas modifié les produits existants)

  console.log('\nDonnées ajoutées avec succès !');
  process.exit(0);
};

seed().catch((e) => { console.error(e); process.exit(1); });
