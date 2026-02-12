declare global {
    interface DocumentEventMap {
        // Egyedi események létrehozása a progress bar frissítéséhez.
        setVideoTime: CustomEvent;
    }
}

export {};
