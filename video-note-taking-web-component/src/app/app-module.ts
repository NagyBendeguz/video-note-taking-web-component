import { CUSTOM_ELEMENTS_SCHEMA, Injector, NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing-module';
import { createCustomElement } from '@angular/elements';
import { VideoPlayer } from './video-player/video-player';
import { VideoNavbar } from './video-navbar/video-navbar';
import { VideoNote } from './video-note/video-note';
import { VideoSettings } from './video-settings/video-settings';
import { CompressedView } from './compressed-view/compressed-view';
import { ExtendedView } from './extended-view/extended-view';
import { EditingView } from './editing-view/editing-view';
import { ConfirmMessage } from './confirm-message/confirm-message';
import { HelpToggle } from './help-toggle/help-toggle';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import InlineTranslateLoader from './i18n/inline-translate-loader';
import en from './i18n/en.json';
import hu from './i18n/hu.json';

@NgModule({
  declarations: [
    VideoPlayer,
    VideoNavbar,
    VideoNote,
    VideoSettings,
    CompressedView,
    ExtendedView,
    EditingView,
    ConfirmMessage,
    HelpToggle
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
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {

  constructor(private injector: Injector) {
    // Átalakítani egy egyedi webkomponensre.
    const videoPlayerElement = createCustomElement(VideoPlayer, { injector });

    // Lehessen használni egyedi webkomponensként.
    customElements.define('video-player', videoPlayerElement);
  }

  ngDoBootstrap() {}
}
