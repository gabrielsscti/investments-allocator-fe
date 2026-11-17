import { BrlCurrencyPipe } from './brl-currency.pipe';

describe('BrlCurrencyPipe', () => {
  const pipe = new BrlCurrencyPipe();

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format 0 minor units as R$ 0,00', () => {
    expect(pipe.transform(0)).toContain('0,00');
  });

  it('should format null or undefined as R$ 0,00', () => {
    expect(pipe.transform(null)).toContain('0,00');
    expect(pipe.transform(undefined)).toContain('0,00');
  });

  it('should format minor units correctly', () => {
    expect(pipe.transform(1050)).toContain('10,50');
    expect(pipe.transform(500000)).toContain('5.000,00');
    expect(pipe.transform('123456')).toContain('1.234,56');
  });

  it('should format negative values correctly', () => {
    expect(pipe.transform(-5000)).toContain('50,00');
    expect(pipe.transform(-5000)).toContain('-');
  });
});
