import { InlineTranslateLoader } from './inline-translate-loader';
import InlineTranslateLoaderDefault from './inline-translate-loader';
import { take } from 'rxjs/operators';

describe('InlineTranslateLoader', () => {
  const data = {
    en: { hello: 'Hello' },
    de: { hello: 'Hallo' },
  };

  it('returns translations for a known language', (done) => {
    const loader = new InlineTranslateLoader(data);
    loader.getTranslation('en').pipe(take(1)).subscribe((res) => {
      expect(res).toEqual({ hello: 'Hello' });
      done();
    });
  });

  it('returns an empty object for an unknown language', (done) => {
    const loader = new InlineTranslateLoader(data);
    loader.getTranslation('fr').pipe(take(1)).subscribe((res) => {
      expect(res).toEqual({});
      done();
    });
  });

  it('works when constructed with an empty object', (done) => {
    const loader = new InlineTranslateLoader({});
    loader.getTranslation('en').pipe(take(1)).subscribe((res) => {
      expect(res).toEqual({});
      done();
    });
  });

  it('default export is the same class (if used)', () => {
    const D: any = InlineTranslateLoaderDefault;
    const instance = new D(data);
    expect(typeof instance.getTranslation).toBe('function');
  });
});
