/**
 * BIZFORGE STATE MANAGER
 * Handles application state and local history.
 * @module StateManager
 */

class StateManager {
    constructor() {
        this.history = JSON.parse(localStorage.getItem('bizforge_history')) || [];
        this.currentView = 'overview';
    }

    /**
     * Saves an item to history
     * @param {object} item { type, content, timestamp }
     */
    addToHistory(item) {
        const entry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...item
        };

        this.history.unshift(entry); // Add to top

        // Limit to 50 items
        if (this.history.length > 50) {
            this.history.pop();
        }

        this.save();
        return entry;
    }

    getHistory() {
        return this.history;
    }

    clearHistory() {
        this.history = [];
        this.save();
    }

    save() {
        localStorage.setItem('bizforge_history', JSON.stringify(this.history));
    }

    setCurrentView(viewId) {
        this.currentView = viewId;
    }
}

export const state = new StateManager();
