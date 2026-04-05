import { CUSTOM_ELEMENTS_SCHEMA, Injector, NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { createCustomElement } from '@angular/elements';
import { VideoPlayer } from './video-player/video-player';
import { VideoNavbar } from './video-navbar/video-navbar';
import { VideoNote } from './video-note/video-note';
import { VideoSettings } from './video-settings/video-settings';
import { CompressedView } from './compressed-view/compressed-view';
import { ExtendedView } from './extended-view/extended-view';
import { EditingView } from './editing-view/editing-view';
import { ConfirmMessage } from './confirm-message/confirm-message';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import InlineTranslateLoader from './i18n/inline-translate-loader';
import en from './i18n/en.json';
import hu from './i18n/hu.json';

@NgModule({
  declarations: [
    App,
    VideoPlayer,
    VideoNavbar,
    VideoNote,
    VideoSettings,
    CompressedView,
    ExtendedView,
    EditingView,
    ConfirmMessage
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    TranslateModule.forRoot({
      loader: { provide: TranslateLoader, useFactory: () => new InlineTranslateLoader({ en, hu }) }
    })
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  //bootstrap: [App] // Alapértelmezett bootstrap kikapcsolása.
})
export class AppModule {

  constructor(private injector: Injector) {
    // Átalakítani egy egyedi web komponensre.
    const videoPlayerElement = createCustomElement(VideoPlayer, { injector });
    const videoNavbarElement = createCustomElement(VideoNavbar, { injector });
    const videoNoteElement = createCustomElement(VideoNote, { injector });
    const videoSettingsElement = createCustomElement(VideoSettings, { injector });
    const compressedViewElement = createCustomElement(CompressedView, { injector });
    const extendedViewElement = createCustomElement(ExtendedView, { injector });
    const editingViewElement = createCustomElement(EditingView, { injector });
    const confirmMessageElement = createCustomElement(ConfirmMessage, { injector });

    // Lehessen használni egyedi web komponensként.
    customElements.define('video-player', videoPlayerElement);
    customElements.define('video-navbar', videoNavbarElement);
    customElements.define('video-note', videoNoteElement);
    customElements.define('video-settings', videoSettingsElement);
    customElements.define('compressed-view', compressedViewElement);
    customElements.define('extended-view', extendedViewElement);
    customElements.define('editing-view', editingViewElement);
    customElements.define('confirm-message', confirmMessageElement);
  }

  ngDoBootstrap() {}
}
