import { BpsPercentPipe } from './bps-percent.pipe';

describe('BpsPercentPipe', () => {
  const pipe = new BpsPercentPipe();

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format 2500 bps as 25,00%', () => {
    expect(pipe.transform(2500)).toBe('25,00%');
  });

  it('should format 10000 bps as 100,00%', () => {
    expect(pipe.transform(10000)).toBe('100,00%');
  });

  it('should format 0 bps as 0,00%', () => {
    expect(pipe.transform(0)).toBe('0,00%');
  });

  it('should format null or undefined as 0,00%', () => {
    expect(pipe.transform(null)).toBe('0,00%');
    expect(pipe.transform(undefined)).toBe('0,00%');
  });
});
