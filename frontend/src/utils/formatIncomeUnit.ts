type SupportedLocale = 'en' | 'ko' | 'es' | 'pt';

interface UnitDef {
  value: number;
  label: Record<SupportedLocale, string>;
}

// 서양식 단위 (천, 백만, 십억, 조)
const WESTERN_UNITS: UnitDef[] = [
  { value: 1e12, label: { en: 'trillion', ko: '조', es: 'billones', pt: 'trilhões' } },
  { value: 1e9, label: { en: 'billion', ko: '십억', es: 'mil millones', pt: 'bilhões' } },
  { value: 1e6, label: { en: 'million', ko: '백만', es: 'millones', pt: 'milhões' } },
  { value: 1e3, label: { en: 'thousand', ko: '천', es: 'mil', pt: 'mil' } },
];

// 한국어 동아시아식 단위 (만, 억, 조)
const KOREAN_UNITS: UnitDef[] = [
  { value: 1e12, label: { en: 'trillion', ko: '조', es: 'billones', pt: 'trilhões' } },
  { value: 1e8, label: { en: 'hundred million', ko: '억', es: 'cien millones', pt: 'cem milhões' } },
  { value: 1e4, label: { en: 'ten thousand', ko: '만', es: 'diez mil', pt: 'dez mil' } },
];

function normalizeLocale(locale: string): SupportedLocale {
  const base = locale.split('-')[0].toLowerCase();
  if (base === 'en' || base === 'ko' || base === 'es' || base === 'pt') {
    return base;
  }
  return 'en';
}

export function formatIncomeUnit(amount: number | null, locale: string): string | null {
  if (amount === null || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const normalizedLocale = normalizeLocale(locale);

  // 한국어는 만/억/조 체계 사용
  const units = normalizedLocale === 'ko' ? KOREAN_UNITS : WESTERN_UNITS;

  for (const unit of units) {
    if (amount >= unit.value) {
      const divided = amount / unit.value;
      const formatted = divided.toLocaleString(normalizedLocale, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      });
      const unitLabel = unit.label[normalizedLocale];

      // 한국어는 숫자와 단위 사이에 공백 없음
      if (normalizedLocale === 'ko') {
        return `${formatted}${unitLabel}`;
      }

      return `${formatted} ${unitLabel}`;
    }
  }

  // 최소 단위 미만: 일반 숫자 포맷
  return amount.toLocaleString(normalizedLocale, { maximumFractionDigits: 0 });
}
