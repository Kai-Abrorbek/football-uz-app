import * as lookup from "country-code-lookup";

export const nationalityToFlagUrl = (nationality: string): string | null => {
  if (!nationality) return null;

  const country = lookup.byCountry(nationality);
  if (!country) return null;

  return `https://flagcdn.com/w40/${country.iso2.toLowerCase()}.png`;
};
