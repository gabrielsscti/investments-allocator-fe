import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'brlCurrency',
  standalone: true
})
export class BrlCurrencyPipe implements PipeTransform {
  transform(minorUnits: number | string | null | undefined): string {
    if (minorUnits === null || minorUnits === undefined || minorUnits === '') {
      return 'R$ 0,00';
    }
    const numericValue = typeof minorUnits === 'string' ? parseFloat(minorUnits) : minorUnits;
    if (isNaN(numericValue)) {
      return 'R$ 0,00';
    }
    const reais = numericValue / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(reais);
  }
}
