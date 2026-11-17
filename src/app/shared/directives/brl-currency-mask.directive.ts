import { Directive, ElementRef, forwardRef, HostListener, inject, Renderer2 } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: 'input[brlCurrencyMask]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BrlCurrencyMaskDirective),
      multi: true
    }
  ]
})
export class BrlCurrencyMaskDirective implements ControlValueAccessor {
  private readonly el = inject(ElementRef<HTMLInputElement>);
  private readonly renderer = inject(Renderer2);

  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};
  private rawMinorUnits: number = 0;

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = input.value.replace(/\D/g, '');
    this.rawMinorUnits = digitsOnly ? parseInt(digitsOnly, 10) : 0;

    if (this.rawMinorUnits > Number.MAX_SAFE_INTEGER) {
      this.rawMinorUnits = Number.MAX_SAFE_INTEGER;
    }

    const formatted = this.formatCurrency(this.rawMinorUnits);
    this.renderer.setProperty(this.el.nativeElement, 'value', formatted);
    this.onChange(this.rawMinorUnits);
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
    const formatted = this.formatCurrency(this.rawMinorUnits);
    this.renderer.setProperty(this.el.nativeElement, 'value', formatted);
  }

  writeValue(value: number | null | undefined): void {
    if (value === null || value === undefined || isNaN(value)) {
      this.rawMinorUnits = 0;
    } else {
      this.rawMinorUnits = Math.round(Number(value));
    }
    const formatted = this.formatCurrency(this.rawMinorUnits);
    this.renderer.setProperty(this.el.nativeElement, 'value', formatted);
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.renderer.setProperty(this.el.nativeElement, 'disabled', isDisabled);
  }

  private formatCurrency(minorUnits: number): string {
    const value = minorUnits / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
}
