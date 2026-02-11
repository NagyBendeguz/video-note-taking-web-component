import { ApplicationRef, ComponentFactoryResolver, CUSTOM_ELEMENTS_SCHEMA, Injector, NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { VideoPlayer } from './video-player/video-player';
import { VideoNavbar } from './video-navbar/video-navbar';
import { createCustomElement } from '@angular/elements';
import { VideoSettings } from './video-settings/video-settings';

@NgModule({
  declarations: [
    App,
    VideoPlayer,
    VideoNavbar,
    VideoSettings
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

  constructor(private injector: Injector, private appRef: ApplicationRef, private componentFactoryResolver: ComponentFactoryResolver) {
    // Átalakítani egy egyedi web komponensre.
    const videoPlayerElement = createCustomElement(VideoPlayer, { injector });
    const videoNavbarElement = createCustomElement(VideoNavbar, { injector });
    const videoSettingsElement = createCustomElement(VideoSettings, { injector });

    // Lehessen használni egyedi web komponensként.
    customElements.define('video-player-element', videoPlayerElement);
    customElements.define('video-navbar-element', videoNavbarElement);
    customElements.define('video-settings-element', videoSettingsElement);
  }
  
  // Manuális bootstrap.
  ngDoBootstrap() {
    const appComponent = this.componentFactoryResolver.resolveComponentFactory(App);
    this.appRef.bootstrap(appComponent);
  }
}
