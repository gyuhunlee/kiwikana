// The one source for colors, type, spacing (docs/theme.md). Nothing else may hold a hex value.

export const lightColors = {
  bg: '#FAF8F3',
  card: '#FFFFFF',
  raised: '#F1EEE7',
  text: '#1C1B19',
  textSecondary: '#6B675F',
  line: '#ECE8DF',
  strokeGuide: '#D3CDBF',
  kiwi: '#8FD14F',
  kiwiTint: '#EAF5DA',
  correct: '#2FB57A',
  wrong: '#E5484D',
  streak: '#F07C2E',
  statBlue: '#4C7EF3',
  statLavender: '#9B7BEA',
  kiwiBrown: '#8B6B4A',
  onText: '#FFFFFF',
} as const;

export type ColorToken = keyof typeof lightColors;
export type Colors = Record<ColorToken, string>;

// Dark values that docs/theme.md gives. textSecondary, line, strokeGuide and kiwiTint are
// "to pick at M11" from the palette card, so dark mode stays off until they are filled in.
export const darkColorsSoFar: Partial<Colors> = {
  bg: '#0F110F',
  card: '#1A1D1A',
  raised: '#242824',
  text: '#F2F3EF',
  kiwi: lightColors.kiwi,
  correct: lightColors.correct,
  wrong: lightColors.wrong,
  streak: lightColors.streak,
  statBlue: lightColors.statBlue,
  statLavender: lightColors.statLavender,
  kiwiBrown: lightColors.kiwiBrown,
  onText: '#0F110F',
};

export const fonts = {
  jpRegular: 'ZenMaruGothic_400Regular',
  jpMedium: 'ZenMaruGothic_500Medium',
  jpBold: 'ZenMaruGothic_700Bold',
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
} as const;

// Sizes other than furigana are starting values until the full-size boards are exported (docs/theme.md).
export const textStyles = {
  jpHero: { fontFamily: fonts.jpMedium, fontSize: 96, lineHeight: 104 },
  jpWord: { fontFamily: fonts.jpBold, fontSize: 40, lineHeight: 48 },
  jpSentence: { fontFamily: fonts.jpRegular, fontSize: 20, lineHeight: 34 },
  jpSentenceTarget: { fontFamily: fonts.jpBold, fontSize: 20, lineHeight: 34 },
  furigana: { fontFamily: fonts.jpRegular, fontSize: 12, lineHeight: 14 },
  title: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22 },
  bodyBold: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22 },
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  stat: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 36 },
} as const;

export const space = {
  s4: 4,
  s8: 8,
  s12: 12,
  s16: 16,
  s20: 20,
  s24: 24,
  s32: 32,
  s48: 48,
  screen: 20,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  full: 999,
} as const;

export const size = {
  line: 1,
  selectedBorder: 2,
  button: 56,
  iconButton: 44,
  tapTarget: 44,
  progressBar: 8,
  tabDot: 6,
} as const;

export const motion = {
  fast: 120,
  base: 220,
  slow: 400,
  stagger: 60,
} as const;
