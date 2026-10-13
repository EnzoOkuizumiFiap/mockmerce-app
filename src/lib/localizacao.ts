import { PontoRetirada } from '../types/localizacao';

/** "2,9 km" — virgula decimal sem depender do Intl no Hermes. */
export function formatarKm(km: number): string {
  return `${(Math.round(km * 10) / 10).toFixed(1).replace('.', ',')} km`;
}

/** Endereco em uma linha, pulando o que a loja deixou em branco. */
export function enderecoResumido(ponto: PontoRetirada): string {
  const { street, number, district, city } = ponto.address;
  return [[street, number].filter(Boolean).join(', '), district, city]
    .filter(Boolean)
    .join(' - ');
}