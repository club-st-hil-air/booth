import React from 'react';
import { parseColors } from '../utils/articleUtils';

interface ColorPaletteProps {
  couleurVoile: string;
  /** Swatch square size in px (default 16). */
  size?: number;
}

/**
 * Renders a row of colour swatches parsed from a glider's free-text colour field.
 * Unknown colour tokens are ignored; renders nothing if no token resolves.
 */
export const ColorPalette: React.FC<ColorPaletteProps> = ({ couleurVoile, size = 16 }) => {
  const colors = parseColors(couleurVoile);
  if (colors.length === 0) return null;

  return (
    <span className="color-palette" aria-label={colors.map((c) => c.name).join(', ')}>
      {colors.map((c, i) => (
        <span
          key={`${c.hex}-${i}`}
          className="color-swatch"
          style={{ background: c.hex, width: size, height: size }}
          title={c.name}
          aria-hidden="true"
        />
      ))}
    </span>
  );
};
