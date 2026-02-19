import { ApplicationRef, CUSTOM_ELEMENTS_SCHEMA, Injector, NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
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

@NgModule({
  declarations: [
    App,
    VideoPlayer,
    VideoNavbar,
    VideoNote,
    VideoSettings,
    CompressedView,
    ExtendedView,
    EditingView

  ],
  imports: [
    BrowserModule,
    AppRoutingModule
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

    // Lehessen használni egyedi web komponensként.
    customElements.define('video-player-element', videoPlayerElement);
    customElements.define('video-navbar-element', videoNavbarElement);
    customElements.define('video-note-element', videoNoteElement);
    customElements.define('video-settings-element', videoSettingsElement);
    customElements.define('compressed-view-element', compressedViewElement);
    customElements.define('extended-view-element', extendedViewElement);
    customElements.define('editing-view-element', editingViewElement);
  }
  
  // Manuális bootstrap.
  ngDoBootstrap(appRef: ApplicationRef) {
    appRef.bootstrap(App);
  }
}
