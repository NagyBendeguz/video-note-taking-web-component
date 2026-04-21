import { Shortcuts } from "./shortcuts";

export class Settings {
    language: string = 'en';
    theme: string = 'light';
    saveSettings: boolean = true;
    convertInput: boolean = true;
    confirmCancel: boolean = false;
    confirmDelete: boolean = true;
    stopVideoOnNote: boolean = true;
    startVideoOnSave: boolean = false;
    thumbnailQualityPercentage: number = 100;
    thumbnailWidth: number = 1;
    thumbnailHeight: number = 1;
    thumbnailForwardRate: number = 1;
    thumbnailRewindRate: number = 1;
    shortcuts: Shortcuts = new Shortcuts();
}
