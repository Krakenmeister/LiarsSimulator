import { Game } from "./Game";
import { GameConfiguration } from "./GameConfiguration";

class Simulator {
	public async runSimulation(config?: GameConfiguration) {
		let game: Game;
		if (config) {
			game = new Game(config);
		} else {
			game = new Game();
		}

		await game.initialize();
		game.runGame();
	}
}

let configuration: GameConfiguration = {
	playerNames: ["Random", "Random", "Random", "Random"],
	chamberRounds: 6,
	handSize: 5,
	aceCount: 6,
	kingCount: 6,
	queenCount: 6,
	jokerCount: 2,
};

let simulator = new Simulator();
simulator.runSimulation(configuration);
