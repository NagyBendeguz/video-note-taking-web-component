import { Entry } from "./entry";
import { Settings } from "./settings";

export class Note {
    videoFileLocation: string = "";
    videoFileName: string = "";
    settings: Settings = new Settings();
    entries: Entry[] = [];
}
