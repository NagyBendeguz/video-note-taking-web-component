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
import { ConfirmDelete } from './confirm-delete/confirm-delete';

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
    ConfirmDelete
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
    const confirmDeleteElement = createCustomElement(ConfirmDelete, { injector });

    // Lehessen használni egyedi web komponensként.
    customElements.define('video-player', videoPlayerElement);
    customElements.define('video-navbar', videoNavbarElement);
    customElements.define('video-note', videoNoteElement);
    customElements.define('video-settings', videoSettingsElement);
    customElements.define('compressed-view', compressedViewElement);
    customElements.define('extended-view', extendedViewElement);
    customElements.define('editing-view', editingViewElement);
    customElements.define('confirm-delete', confirmDeleteElement);
  }

  ngDoBootstrap() {}
}
