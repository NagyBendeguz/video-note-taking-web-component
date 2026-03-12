export class Entry {
    entryId: number;
    title: string;
    thumbnail: string;
    timestamp: string;
    note: string;

    constructor(thumbnail: string = "", timestamp: string = "00:00:00.000") {
        this.entryId = 0;
        this.title = "";
        this.thumbnail = thumbnail;
        this.timestamp = timestamp;
        this.note = "";
    }
}
