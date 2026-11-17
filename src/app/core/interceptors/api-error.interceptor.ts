import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BackendErrorResponse } from '../models/portfolio.models';

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ocorreu um erro inesperado ao se comunicar com o servidor.';

      if (error.status === 502 || error.status === 503 || error.status === 504) {
        errorMessage = 'Serviço de alocação indisponível (502/503). Verifique se o daemon backend está em execução.';
      } else if (error.error && typeof error.error === 'object') {
        const backendError = error.error as BackendErrorResponse;
        if (backendError.error) {
          errorMessage = backendError.field
            ? `Campo '${backendError.field}': ${backendError.error}`
            : backendError.error;
        }
      } else if (typeof error.error === 'string' && error.error.includes('<html')) {
        errorMessage = `Erro de comunicação com o servidor (${error.status}): Gateway retornado em formato HTML.`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return throwError(() => new Error(errorMessage));
    })
  );
};
