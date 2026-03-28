import { Shortcuts } from "./shortcuts";

export class Settings {
    language: string = 'en';
    thumbnailResolution: string = '';
    convertInput: boolean = false;
    theme: string = '';
    confirmCancel: boolean = false;
    confirmDelete: boolean = true;
    thumbnailForwardRate: number = 1;
    thumbnailRewindRate: number = 1;
    shortcuts: Shortcuts = new Shortcuts();
}
