export interface ArticleRaw {
  idLot: string;
  numeroCoupon: string;
  type: string; // "0": Voile, "1": Sellette, "2": Secours, "3": Accessoire
  statut: string; // "En vente", "Paye remis", etc.
  marque: string;
  modele: string;
  homologation?: string;
  prixVente: string;
  PTVMin?: string;
  PTVMax?: string;
  taille?: string;
  annee?: string;
  couleurVoile?: string;
  commentaire?: string;
  prenomVendeur?: string;
  nomVendeur?: string;
  telephoneVendeur?: string;
}

export type CategoryType = '0' | '1' | '2' | '3';

export interface ArticleItem {
  typeCode: string;
  typeLabel: string;
  typeIcon: string;
  marque: string;
  modele: string;
  homologation: string;
  PTVMin: number;
  PTVMax: number;
  taille: string;
  annee: string;
  couleurVoile: string;
  commentaire: string;
}

export interface Lot {
  idLot: string;
  numeroCoupon: string;
  prixVente: number;
  prixVenteStr: string;
  statut: string;
  vendeurInfo?: string;
  vendeurTel?: string;
  articles: ArticleItem[];
  primaryArticle: ArticleItem;
  title: string;
}

// Alias Article to Lot for backwards compatibility across existing components
export type Article = Lot;

export type ViewMode = 'grid' | 'table';

export type SortField = 'idLot' | 'prixVente' | 'marque' | 'modele' | 'PTVMax' | 'annee' | 'numeroCoupon' | 'taille' | 'homologation';
export type SortOrder = 'asc' | 'desc';

export interface FilterState {
  searchQuery: string;
  selectedStatus: string;
  selectedType: string; // 'ALL', '0', '1', '2', '3'
  selectedBrand: string;
  selectedHomologation: string;
  selectedProfile: string; // 'ALL', 'school', 'progression', 'performance', 'light', 'tandem'
  minPrice: string;
  maxPrice: string;
  ptvTarget: string; // Pilot flight weight in kg
  onlyFavorites: boolean;
}
