import { Shortcuts } from "./shortcuts";

export class Settings {
    language: string = 'en';
    theme: string = '';
    thumbnailResolutionPercentage: number = 100;
    thumbnailWidth: number = 1;
    thumbnailHeight: number = 1;
    convertInput: boolean = true;
    confirmCancel: boolean = false;
    confirmDelete: boolean = true;
    thumbnailForwardRate: number = 1;
    thumbnailRewindRate: number = 1;
    shortcuts: Shortcuts = new Shortcuts();
}
