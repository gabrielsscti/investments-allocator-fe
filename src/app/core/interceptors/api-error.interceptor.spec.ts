import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { apiErrorInterceptor } from './api-error.interceptor';

describe('apiErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should pass successful response through', () => {
    http.get('/test').subscribe((res) => {
      expect(res).toEqual({ ok: true });
    });

    const req = httpMock.expectOne('/test');
    req.flush({ ok: true });
  });

  it('should format 502 Bad Gateway response', (done) => {
    http.get('/test').subscribe({
      next: () => fail('should have failed with 502'),
      error: (err: Error) => {
        expect(err.message).toContain('Serviço de alocação indisponível (502/503)');
        done();
      }
    });

    const req = httpMock.expectOne('/test');
    req.flush('Bad Gateway', { status: 502, statusText: 'Bad Gateway' });
  });

  it('should format backend structured error with field', (done) => {
    http.get('/test').subscribe({
      next: () => fail('should have failed with 400'),
      error: (err: Error) => {
        expect(err.message).toBe("Campo 'amount': amount must be greater than 0");
        done();
      }
    });

    const req = httpMock.expectOne('/test');
    req.flush(
      { error: 'amount must be greater than 0', field: 'amount' },
      { status: 400, statusText: 'Bad Request' }
    );
  });

  it('should format HTML error response gracefully', (done) => {
    http.get('/test').subscribe({
      next: () => fail('should have failed with HTML error'),
      error: (err: Error) => {
        expect(err.message).toContain('Gateway retornado em formato HTML');
        done();
      }
    });

    const req = httpMock.expectOne('/test');
    req.flush('<html><body>500 Internal Error</body></html>', {
      status: 500,
      statusText: 'Internal Server Error'
    });
  });
});
