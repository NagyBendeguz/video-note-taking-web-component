import { TestBed } from '@angular/core/testing';
import { createCustomElement } from '@angular/elements';
import { Injector, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoPlayer } from './app/video-player/video-player';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockTranslateService } from './test-utils/mock-translate.service';

@NgModule({
  declarations: [VideoPlayer],
  imports: [CommonModule, TranslateModule.forRoot()]
})
class TestModule {}

describe('MyElement (Angular Element integration)', () => {
  let injector: Injector;
  let mockTranslate: MockTranslateService;

  beforeEach(async () => {
    mockTranslate = new MockTranslateService();
    await TestBed.configureTestingModule({
      imports: [TestModule],
      providers: [{ provide: TranslateService, useValue: mockTranslate }]
    }).compileComponents();
  
    injector = TestBed.inject(Injector);
  });

  it('registers custom element and maps properties/attributes', () => {
    const elClass = createCustomElement(VideoPlayer, { injector });
    if (!customElements.get('video-player')) {
      customElements.define('video-player', elClass);
    }

    const host = document.createElement('div');
    document.body.appendChild(host);

    const el = document.createElement('video-player') as any;
    el.title = 'FromProp';
    el.setAttribute('title', 'FromAttr');

    host.appendChild(el);

    return Promise.resolve().then(() => {
      expect(el.title === 'FromProp' || el.getAttribute('title') === 'FromAttr').toBeTrue();
      let handled = false;
      el.addEventListener('clicked', () => (handled = true));
      el.dispatchEvent(new Event('clicked'));
      expect(handled).toBeTrue();
      host.remove();
    });
  });
});
