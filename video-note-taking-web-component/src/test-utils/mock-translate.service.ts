/// <reference types="jasmine" />
import { Subject, of } from 'rxjs';

export class MockTranslateService {
  onTranslationChange = new Subject<any>();
  onLangChange = new Subject<any>();
  onDefaultLangChange = new Subject<any>();
  onFallbackLangChange = new Subject<any>();
  currentLang = 'en';

  addLangs = jasmine.createSpy('addLangs');
  setFallbackLang = jasmine.createSpy('setFallbackLang');
  use = jasmine.createSpy('use');

  get(key: any) { return of(key); }
  instant(key: any) { return key; }
}
