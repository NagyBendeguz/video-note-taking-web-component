import { Shortcuts } from "./shortcuts";

export class Settings {
    language: string = 'en';
    thumbnailResolution: string = '';
    convertInput: boolean = false;
    theme: string = '';
    confirmCancel: boolean = false;
    confirmDelete: boolean = true;
    videoMoveRate: number = 0;
    thumbnailForwardRate: number = 1;
    thumbnailRewindRate: number = 1;
    fontSize: number = 16;
    videoNavbarOffset: boolean = true;
    shortcuts: Shortcuts = new Shortcuts();
}
