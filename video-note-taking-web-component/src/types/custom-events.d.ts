// Egyedi esemény létrehozása a progress bar frissítéséhez.
declare global {
    interface DocumentEventMap {
        videoTimeUpdate: CustomEvent;
        setVideoTime: CustomEvent;
    }
}

export {};
