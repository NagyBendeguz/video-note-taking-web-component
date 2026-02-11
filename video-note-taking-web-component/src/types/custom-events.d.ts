declare global {
    interface DocumentEventMap {
        // Egyedi események létrehozása a progress bar frissítéséhez.
        updateVideoTime: CustomEvent;
        setVideoTime: CustomEvent;
    }
}

export {};
