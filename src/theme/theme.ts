// theme.ts
// Design system tokens — Marketplace minimal, orienté sécurité/technique
// Supporte thème clair et sombre.

export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceRaised: string; // pour cards qui doivent ressortir légèrement du fond
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Couleur de marque — utilisée UNIQUEMENT pour CTA, badges "Vérifié", liens actifs
  brand: string;
  brandLight: string; // fond léger pour badges/chips actifs

  // États matériel (badges "état")
  stateNew: string;
  stateGood: string;
  stateWorn: string;
  // fonds associés (badges), plus doux que les couleurs pleines
  stateNewBg: string;
  stateGoodBg: string;
  stateWornBg: string;

  // Système
  danger: string;
  success: string;
  overlay: string;
}

export const lightColors: ThemeColors = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  border: '#E5E5E5',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textMuted: '#9C9C9C',

  brand: '#D9542A',
  brandLight: '#F7E3DA',

  stateNew: '#2D5A4A',
  stateGood: '#3F7DBF',
  stateWorn: '#B0862E',
  stateNewBg: '#E4EEEA',
  stateGoodBg: '#E3ECF6',
  stateWornBg: '#F3EAD8',

  danger: '#C4462B',
  success: '#2D5A4A',
  overlay: 'rgba(0,0,0,0.4)',
};

export const darkColors: ThemeColors = {
  background: '#121212',
  surface: '#1C1C1E',
  surfaceRaised: '#242426',
  border: '#2E2E30',
  textPrimary: '#F2F2F2',
  textSecondary: '#A8A8A8',
  textMuted: '#767678',

  // Brand légèrement éclairci pour rester lisible sur fond sombre
  brand: '#E56A3D',
  brandLight: '#3A2620', // fond sombre teinté, pas un pastel clair

  // États — désaturés/éclaircis pour garder du contraste sans agresser l'œil
  stateNew: '#5FA98B',
  stateGood: '#6FA8DC',
  stateWorn: '#D1A85C',
  stateNewBg: '#1E2C27',
  stateGoodBg: '#1E2A36',
  stateWornBg: '#2E2618',

  danger: '#E06B4D',
  success: '#5FA98B',
  overlay: 'rgba(0,0,0,0.6)',
};

// ---------------------------------------------------------------------------
// Typo, spacing, radius — identiques dans les deux thèmes
// ---------------------------------------------------------------------------

export const typography = {
  fontFamily: 'System', // ou 'Inter' si chargée via expo-font
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 22,
    price: 20, // taille dédiée pour toujours ressortir
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    bold: '700' as const,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999, // pour les chips de filtre
} as const;

export const layout = {
  cardPadding: spacing.md,
  gridGap: spacing.sm,
  screenPadding: spacing.md,
} as const;

// Ombre — désactivée en dark (préférer une bordure) car les shadows CSS/RN
// sont quasi invisibles sur fond sombre et donnent un résultat sale.
export const getShadow = (scheme: ColorScheme) =>
  scheme === 'light'
    ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
      }
    : {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
      };

// ---------------------------------------------------------------------------
// Assemblage du thème
// ---------------------------------------------------------------------------

export const buildTheme = (scheme: ColorScheme) => {
  const colors = scheme === 'light' ? lightColors : darkColors;
  return {
    scheme,
    colors,
    typography,
    spacing,
    radius,
    layout,
    shadow: getShadow(scheme),
    stateColors: {
      new: colors.stateNew,
      good: colors.stateGood,
      worn: colors.stateWorn,
    },
    stateBackgrounds: {
      new: colors.stateNewBg,
      good: colors.stateGoodBg,
      worn: colors.stateWornBg,
    },
  } as const;
};

export const lightTheme = buildTheme('light');
export const darkTheme = buildTheme('dark');

export type Theme = ReturnType<typeof buildTheme>;

export function useThemeToken(override?: ColorScheme): Theme {
  const scheme: ColorScheme = override ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  return scheme === 'dark' ? darkTheme : lightTheme;
}

export default lightTheme;
