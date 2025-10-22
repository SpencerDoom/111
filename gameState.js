// GameState manager for handling different game states
class GameState {
    constructor() {
        this.currentState = 'start'; // 'start', 'playing', 'levelUp', 'gameOver', 'shop'
        this.previousState = null;
    }

    setState(newState) {
        this.previousState = this.currentState;
        this.currentState = newState;
        console.log(`State changed from ${this.previousState} to ${this.currentState}`);
    }

    getState() {
        return this.currentState;
    }

    getPreviousState() {
        return this.previousState;
    }

    isState(state) {
        return this.currentState === state;
    }

    // State transition methods
    startGame() {
        this.setState('playing');
    }

    pauseGame() {
        if (this.currentState === 'playing') {
            this.setState('paused');
        }
    }

    resumeGame() {
        if (this.currentState === 'paused') {
            this.setState('playing');
        }
    }

    triggerLevelUp() {
        this.setState('levelUp');
    }

    continuePlaying() {
        this.setState('playing');
    }

    gameOver() {
        this.setState('gameOver');
    }

    returnToStart() {
        this.setState('start');
    }

    openShop() {
        this.setState('shop');
    }
}