import type { PickupPoint } from '@/types/location';

/** "2,9 km" (vírgula decimal, sem depender do Intl no Hermes). */
export function formatKm(km: number): string {
  return `${(Math.round(km * 10) / 10).toFixed(1).replace('.', ',')} km`;
}

/** Endereço em uma linha, pulando o que a loja deixou em branco. */
export function addressSummary(point: PickupPoint): string {
  const { street, number, district, city } = point.address;
  return [[street, number].filter(Boolean).join(', '), district, city]
    .filter(Boolean)
    .join(' - ');
}