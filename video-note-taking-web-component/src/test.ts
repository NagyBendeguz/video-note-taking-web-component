import { getTestBed } from '@angular/core/testing';
import {
  BrowserTestingModule,
  platformBrowserTesting
} from '@angular/platform-browser/testing';

declare const require: any;

getTestBed().initTestEnvironment(
  BrowserTestingModule,
  platformBrowserTesting(),
);

// load specs (webpack) or (Vite / modern) fallback
if (typeof require !== 'undefined' && typeof require.context === 'function') {
  const context = require.context('./', true, /\.spec\.ts$/);
  context.keys().forEach(context);
} else if (typeof (import.meta as any)?.glob === 'function') {
  // Vite / esbuild style: eager import all spec modules
  const tests = (import.meta as any).glob('./**/*.spec.ts', { eager: true });
  Object.values(tests);
} else {
  // last-resort: use Karma file registry (works when specs are served by Karma)
  const files = (window as any).__karma__?.files || {};
  Object.keys(files)
    .filter((f) => f.endsWith('.spec.js'))
    .forEach((f) => {
      // Karma serves compiled .js files under /base/
      require(f.replace(/^\/base\//, './'));
    });
}
