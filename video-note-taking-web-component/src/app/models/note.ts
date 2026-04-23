import { Entry } from "./entry";
import { Settings } from "./settings";

export class Note {
    settings: Settings = new Settings();
    entries: Entry[] = [];
}
