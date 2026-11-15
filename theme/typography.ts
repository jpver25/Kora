import { TextStyle } from 'react-native';

export const fontFamilies = {
  display: 'Fraunces_700Bold',
  displayMedium: 'Fraunces_600SemiBold',
  body: 'Nunito_500Medium',
  bodyBold: 'Nunito_700Bold',
  bodySemi: 'Nunito_600SemiBold',
  bodyRegular: 'Nunito_400Regular',
} as const;

export const typography = {
  hero: {
    fontFamily: fontFamilies.display,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.5,
  } satisfies TextStyle,
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.3,
  } satisfies TextStyle,
  subtitle: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 18,
    lineHeight: 26,
  } satisfies TextStyle,
  body: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 16,
    lineHeight: 24,
  } satisfies TextStyle,
  bodyStrong: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 16,
    lineHeight: 24,
  } satisfies TextStyle,
  caption: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 13,
    lineHeight: 18,
  } satisfies TextStyle,
  label: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  tab: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 11,
    lineHeight: 14,
  } satisfies TextStyle,
} as const;
