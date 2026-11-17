import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BrlCurrencyMaskDirective } from './brl-currency-mask.directive';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, BrlCurrencyMaskDirective],
  template: `<input [formControl]="control" brlCurrencyMask />`
})
class TestHostComponent {
  control = new FormControl<number>(1050);
}

describe('BrlCurrencyMaskDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let inputEl: HTMLInputElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent]
    });

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    inputEl = fixture.nativeElement.querySelector('input');
  });

  it('should initialize input with formatted currency value', () => {
    expect(inputEl.value).toContain('10,50');
  });

  it('should format input digits and update control with minor units (cents)', () => {
    inputEl.value = '500000';
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance.control.value).toBe(500000);
    expect(inputEl.value).toContain('5.000,00');
  });

  it('should handle zero value', () => {
    inputEl.value = '0';
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance.control.value).toBe(0);
    expect(inputEl.value).toContain('0,00');
  });

  it('should strip non-digits when user pastes text', () => {
    inputEl.value = 'R$ 1.234,56 abc';
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance.control.value).toBe(123456);
    expect(inputEl.value).toContain('1.234,56');
  });

  it('should reformat on blur', () => {
    inputEl.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(inputEl.value).toContain('10,50');
  });
});
