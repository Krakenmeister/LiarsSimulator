import path, { dirname } from "path";
import fs from "fs/promises";
import { fileURLToPath, pathToFileURL } from "url";

import { GameConfiguration } from "./GameConfiguration";
import { Player } from "./Player";
import { getRandomNumber, shuffleArray } from "./Utils";
import { Action, actionToString } from "./Action";
import { Card, tableToString } from "./Hand";
import { PublicGameState, PublicPlayer } from "./PublicGameState";

const defaultConfiguration: GameConfiguration = {
	playerNames: ["Challenger", "Challenger", "Challenger", "Challenger"],
	chamberRounds: 6,
	handSize: 5,
	aceCount: 6,
	kingCount: 6,
	queenCount: 6,
	jokerCount: 2,
};

export class Game {
	private config: GameConfiguration;
	private players: Player[];
	private table: Card;
	private gameId: number;
	private gameHistory: PublicGameState[];

	constructor(config?: GameConfiguration, gameId?: number) {
		if (config) {
			this.config = config;
		} else {
			this.config = defaultConfiguration;
		}

		if (gameId) {
			this.gameId = gameId;
		} else {
			this.gameId = getRandomNumber(10000, 99999);
		}

		this.players = [];
	}

	public async initialize() {
		for (let playerName of this.config.playerNames) {
			this.players.push(await this.createPlayer(playerName));
		}
	}

	public runGame(): void {
		this.gameHistory = [];
		console.log(`~~~ Beginning new game! (${this.gameId}) ~~~`);

		let roundNumber: number = 0;
		while (!this.isGameOver()) {
			this.drawHands();
			this.rerollTable();
			console.log(`\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n`);
			console.log(`[Game ${this.gameId}]: Round ${roundNumber}, ${tableToString(this.table)}`);

			let previousActorLying: boolean = false;
			let lastToAct: number = -1;
			let currentlyActing: number = 0;

			let continueRound: boolean = true;
			let turnNumber: number = 0;
			while (continueRound) {
				let isValidActor: boolean = !this.players[currentlyActing].isDead && this.players[currentlyActing].hand.cards.length > 0;
				while (!isValidActor) {
					currentlyActing = (currentlyActing + 1) % this.players.length;
					isValidActor = !this.players[currentlyActing].isDead && this.players[currentlyActing].hand.cards.length > 0;
				}

				console.log(`\n\n[Game ${this.gameId}]: Turn ${turnNumber}`);
				console.log(
					`[Game ${this.gameId}]: Player ${currentlyActing}'s turn (${this.config.playerNames[currentlyActing]} #${this.players[currentlyActing].id})`
				);
				console.log(`[Game ${this.gameId}]: Current chamber = ${this.players[currentlyActing].currentChamber}`);
				console.log(`[Game ${this.gameId}]: ${this.players[currentlyActing].hand.toString()}`);

				let wasLie: boolean = previousActorLying;

				let playerAction: Action = this.players[currentlyActing].takeAction(this.gameHistory);
				previousActorLying = this.resolveAction(playerAction, currentlyActing, lastToAct, previousActorLying);

				let currentPublicInformation: PublicGameState = this.packagePublicInformation(playerAction, currentlyActing);
				this.gameHistory.push(currentPublicInformation);

				turnNumber++;
				lastToAct = currentlyActing;
				currentlyActing = (currentlyActing + 1) % this.players.length;

				continueRound = playerAction.cardIndicesPlayed.length > 0;
				if (!continueRound) {
					this.gameHistory[this.gameHistory.length - 2].wasLie = wasLie;
				}
			}
			roundNumber++;
			console.log("\n");
		}
		for (let playerIndex: number = 0; playerIndex < this.players.length; playerIndex++) {
			if (!this.players[playerIndex].isDead) {
				console.log(
					`\n[Game ${this.gameId}]: WINNER! Player ${playerIndex} (${this.config.playerNames[playerIndex]} #${this.players[playerIndex].id})`
				);
			}
		}
	}

	public getConfig(): GameConfiguration {
		return this.config;
	}

	private rerollTable(): void {
		let tableRoll: number = getRandomNumber(0, 2);
		switch (tableRoll) {
			case 0:
				this.table = Card.Queen;
				break;
			case 1:
				this.table = Card.King;
				break;
			case 2:
				this.table = Card.Ace;
				break;
		}
	}

	private async createPlayer(playerName: string) {
		const __filename = fileURLToPath(import.meta.url);
		const __dirname = dirname(__filename);

		const botFilePath = path.join(__dirname, "./bots", `${playerName}.ts`);
		try {
			await fs.access(botFilePath);
		} catch {
			throw new Error(`Bot file ${playerName}.ts does not exist!`);
		}

		try {
			const fileUrl = pathToFileURL(botFilePath).href;
			const module = await import(fileUrl);

			const BotClass = module.default || module[playerName];
			if (!BotClass) {
				throw new Error(`Bot file ${playerName}.ts does not export a default or properly named class`);
			}

			let playerInstance = new BotClass();
			if (!(playerInstance instanceof Player)) {
				throw new Error(`Bot ${playerName}.ts does not extend Player!`);
			}

			return playerInstance;
		} catch (error) {
			console.error(`Failed to load bot ${playerName}: `, error);
			throw error;
		}
	}

	private drawHands(): void {
		let deck: Card[] = [];

		for (let i = 0; i < this.config.queenCount; i++) {
			deck.push(Card.Queen);
		}
		for (let i = 0; i < this.config.kingCount; i++) {
			deck.push(Card.King);
		}
		for (let i = 0; i < this.config.aceCount; i++) {
			deck.push(Card.Ace);
		}
		for (let i = 0; i < this.config.jokerCount; i++) {
			deck.push(Card.Joker);
		}

		shuffleArray(deck);

		for (let player of this.players) {
			player.hand.cards = [];
		}

		for (let handIndex: number = 0; handIndex < this.config.handSize; handIndex++) {
			for (let playerIndex: number = 0; playerIndex < this.players.length; playerIndex++) {
				let topCard: Card | undefined = deck.pop();
				if (topCard !== undefined) {
					this.players[playerIndex].hand.drawCard(topCard);
				} else {
					console.error("Attempting to draw card from an empty deck!");
				}
			}
		}
	}

	private packagePublicPlayer(player: Player): PublicPlayer {
		let publicPlayer: PublicPlayer = {
			playerId: player.id,
			currentChamber: player.currentChamber,
			cardsInHand: player.hand.cards.length,
			isDead: player.isDead,
		};
		return publicPlayer;
	}

	private packagePublicInformation(currentAction: Action, currentlyActing: number): PublicGameState {
		let orderedPlayers: PublicPlayer[] = [];
		let currentPlayerIndex: number = currentlyActing;
		for (let i = 0; i < this.players.length; i++) {
			orderedPlayers.push(this.packagePublicPlayer(this.players[(currentPlayerIndex + i) % this.players.length]));
		}
		let currentPublicInformation: PublicGameState = {
			players: orderedPlayers,
			action: currentAction,
			table: this.table,
		};
		return currentPublicInformation;
	}

	private isGameOver(): boolean {
		let playerAliveCount: number = 0;
		for (let playerIndex: number = 0; playerIndex < this.players.length; playerIndex++) {
			if (!this.players[playerIndex].isDead) {
				playerAliveCount++;
			}
		}
		return playerAliveCount <= 1;
	}

	private resolveAction(action: Action, currentlyActing: number, lastToAct: number, previousActorLying: boolean): boolean {
		let isLastInPlay: boolean = true;
		for (let playerIndex: number = 0; playerIndex < this.players.length; playerIndex++) {
			if (currentlyActing !== playerIndex && !this.players[playerIndex].isDead && this.players[playerIndex].hand.cards.length > 0) {
				isLastInPlay = false;
			}
		}
		if (action.cardIndicesPlayed.length === 0 || isLastInPlay) {
			action.cardIndicesPlayed = [];
			console.log(`[Game ${this.gameId}]: ${isLastInPlay ? "Forced " : ""}${actionToString(action)}`);

			if (lastToAct === -1) {
				console.log(`[Game ${this.gameId}]: Player ${currentlyActing} challenged themselves!`);
				this.players[currentlyActing].shootSelf(this.config);
				if (!this.players[currentlyActing].isDead) {
					console.log(`[Game ${this.gameId}]: -- blank -- chamber: ${this.players[currentlyActing].currentChamber}`);
				} else {
					console.log(`[Game ${this.gameId}]: DEAD!`);
				}
				return false;
			}
			if (previousActorLying) {
				console.log(
					`[Game ${this.gameId}]: Player ${lastToAct} (${this.config.playerNames[lastToAct]} #${this.players[lastToAct].id}) lied and has to shoot themselves!`
				);
				this.players[lastToAct].shootSelf(this.config);
				if (!this.players[lastToAct].isDead) {
					console.log(`[Game ${this.gameId}]: -- blank -- chamber: ${this.players[lastToAct].currentChamber}`);
				} else {
					console.log(`[Game ${this.gameId}]: DEAD!`);
				}
			} else {
				console.log(
					`[Game ${this.gameId}]: Player ${lastToAct} (${this.config.playerNames[lastToAct]} #${this.players[lastToAct].id}) told the truth so player ${currentlyActing} has to shoot themselves!`
				);
				this.players[currentlyActing].shootSelf(this.config);
				if (!this.players[currentlyActing].isDead) {
					console.log(`[Game ${this.gameId}]: -- blank -- chamber: ${this.players[currentlyActing].currentChamber}`);
				} else {
					console.log(`[Game ${this.gameId}]: DEAD!`);
				}
			}

			return false;
		}

		let cardsPlayed: Card[] = this.players[currentlyActing].hand.playCards(action.cardIndicesPlayed);
		let isLie: boolean = false;
		for (let card of cardsPlayed) {
			if (card !== this.table && card !== Card.Joker) {
				isLie = true;
			}
		}

		console.log(`[Game ${this.gameId}]: ${actionToString(action)} (${isLie ? "lie" : "truth"})`);
		console.log(`[Game ${this.gameId}]: ${this.players[currentlyActing].hand.toString()}`);

		return isLie;
	}
}
