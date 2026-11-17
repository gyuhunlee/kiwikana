import { createContext, useContext, type ReactNode } from 'react';
import { lightColors, motion, radius, size, space, textStyles, type Colors } from './tokens';

export interface Theme {
  colors: Colors;
  text: typeof textStyles;
  space: typeof space;
  radius: typeof radius;
  size: typeof size;
  motion: typeof motion;
}

// Light only until M11: four dark tokens are still to be copied from the palette card (docs/theme.md).
const lightTheme: Theme = { colors: lightColors, text: textStyles, space, radius, size, motion };

const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeContext.Provider value={lightTheme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
