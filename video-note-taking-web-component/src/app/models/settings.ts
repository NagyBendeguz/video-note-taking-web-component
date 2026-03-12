import { Shortcuts } from "./shortcuts";

export class Settings {
    language: string = "en";
    thumbnailResolution: string = "";
    convertInput: boolean = false;
    theme: string = "";
    confirmCancel: boolean = false;
    confirmDelete: boolean = true;
    defaultFolderLocation: string = "";
    videoMoveRate: number = 0;
    thumbnailForwardRate: number = 1;
    thumbnailRewindRate: number = 1;
    autoSave: boolean = false;
    fontSize: number = 16;
    shortcuts: Shortcuts = new Shortcuts();
}
