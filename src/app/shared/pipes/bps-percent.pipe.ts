import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'bpsPercent',
  standalone: true
})
export class BpsPercentPipe implements PipeTransform {
  transform(bps: number | null | undefined): string {
    if (bps === null || bps === undefined || isNaN(bps)) {
      return '0,00%';
    }
    const ratio = bps / 10000;
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(ratio);
  }
}
