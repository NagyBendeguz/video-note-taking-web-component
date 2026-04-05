import { Observable, of } from 'rxjs';
import { TranslateLoader } from '@ngx-translate/core';

export class InlineTranslateLoader implements TranslateLoader {
  constructor(private data: Record<string, any>) {}
  getTranslation(lang: string): Observable<any> {
    return of(this.data[lang] || {});
  }
}
export default InlineTranslateLoader;
