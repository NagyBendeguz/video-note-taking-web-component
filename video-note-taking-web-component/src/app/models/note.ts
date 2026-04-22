import { Entry } from "./entry";
import { Settings } from "./settings";

export class Note {
    entries: Entry[] = [];
    settings: Settings = new Settings();
}
