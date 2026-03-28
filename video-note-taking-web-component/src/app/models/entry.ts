export class Entry {
    entryId: number;
    title: string;
    timestamp: string;
    note: string;
    formattedNote: string;
    thumbnail: string;

    constructor(timestamp: string = '00:00:00.000', thumbnail: string = '') {
        this.entryId = 0;
        this.title = '';
        this.timestamp = timestamp;
        this.note = '';
        this.formattedNote = '';
        this.thumbnail = thumbnail;
    }
}
