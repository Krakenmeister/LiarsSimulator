import path, { dirname } from "path";
import fs from "fs/promises";
import { fileURLToPath, pathToFileURL } from "url";

import { GameConfiguration } from "./GameConfiguration";
import { Player } from "./Player";
import { getRandomNumber, processImports, shuffleArray } from "./Utils";
import { Action, actionToString } from "./Action";
import { Card, tableToString } from "./Hand";
import { PublicGameState, PublicPlayer } from "./PublicGameState";

const defaultConfiguration: GameConfiguration = {
	playerNames: ["Random", "Random", "Random", "Truth"],
	chamberRounds: 6,
	handSize: 5,
	aceCount: 6,
	kingCount: 6,
	queenCount: 6,
	jokerCount: 2,
};

export class Game {
	private config: GameConfiguration;
	public players: Player[];
	private table: Card;
	private gameId: number;
	private gameHistory: PublicGameState[];

	private roundNumber: number = 0;

	private previousActorLying: boolean = false;
	private lastToAct: number = -1;
	private currentlyActing: number = 0;
	private continueRound: boolean = true;
	private turnNumber: number = 0;

	private hasBegunGame: boolean = false;
	private hasBegunRound: boolean = false;

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
		this.gameHistory = [];
		this.table = Card.Joker;
	}

	public async initialize() {
		for (let playerName of this.config.playerNames) {
			this.players.push(await this.createPlayer(playerName));
		}
	}

	public playTurn(): void {
		let isValidActor: boolean = !this.players[this.currentlyActing].isDead && this.players[this.currentlyActing].hand.cards.length > 0;
		while (!isValidActor) {
			this.currentlyActing = (this.currentlyActing + 1) % this.players.length;
			isValidActor = !this.players[this.currentlyActing].isDead && this.players[this.currentlyActing].hand.cards.length > 0;
		}

		console.log(`\n\n[Game ${this.gameId}]: Turn ${this.turnNumber}`);
		console.log(
			`[Game ${this.gameId}]: Player ${this.currentlyActing}'s turn (${this.config.playerNames[this.currentlyActing]} #${
				this.players[this.currentlyActing].id
			})`
		);
		console.log(`[Game ${this.gameId}]: Current chamber = ${this.players[this.currentlyActing].currentChamber}`);
		console.log(`[Game ${this.gameId}]: ${this.players[this.currentlyActing].hand.toString()}`);

		let wasLie: boolean = this.previousActorLying;

		let playerAction: Action = this.players[this.currentlyActing].takeAction(this.gameHistory);
		this.previousActorLying = this.resolveAction(playerAction);

		let currentPublicInformation: PublicGameState = this.packagePublicInformation(playerAction);
		this.gameHistory.push(currentPublicInformation);

		this.turnNumber++;
		this.lastToAct = this.currentlyActing;
		this.currentlyActing = (this.currentlyActing + 1) % this.players.length;

		this.continueRound = playerAction.cardIndicesPlayed.length > 0;
		if (!this.continueRound) {
			if (this.gameHistory.length >= 2) {
				this.gameHistory[this.gameHistory.length - 2].wasLie = wasLie;
			}
			this.hasBegunRound = false;
		}
	}

	public playRound(): void {
		this.beginRound();
		while (this.continueRound) {
			this.playTurn();
		}
		console.log("\n");
	}

	public playGame(): void {
		this.beginGame();
		while (!this.isGameOver()) {
			this.playRound();
		}

		this.declareWinner();
	}

	private beginGame(): void {
		this.hasBegunGame = true;
		this.gameHistory = [];
		console.log(`~~~ Beginning new game! (${this.gameId}) ~~~`);

		this.roundNumber = 0;
	}

	private beginRound(): void {
		this.hasBegunRound = true;
		this.roundNumber++;

		this.drawHands();
		this.rerollTable();
		console.log(`\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n`);
		console.log(`[Game ${this.gameId}]: Round ${this.roundNumber}, ${tableToString(this.table)}`);

		this.previousActorLying = false;
		this.lastToAct = -1;
		this.currentlyActing = 0;

		this.continueRound = true;
		this.turnNumber = 1;

		this.gameHistory.push(this.packagePublicInformation({ cardIndicesPlayed: [] }));
	}

	public step(): void {
		if (this.isGameOver()) {
			this.declareWinner();
			return;
		}

		if (!this.hasBegunGame) {
			this.beginGame();
		}

		if (!this.hasBegunRound) {
			this.beginRound();
		}

		this.playTurn();
	}

	public continue(): void {
		if (this.isGameOver()) {
			this.declareWinner();
			return;
		}

		if (!this.hasBegunGame) {
			this.beginGame();
		}

		if (!this.hasBegunRound) {
			this.beginRound();
		}

		while (this.continueRound) {
			this.playTurn();
		}
		console.log("\n");
	}

	public run(): void {
		if (this.isGameOver()) {
			this.declareWinner();
			return;
		}

		if (!this.hasBegunGame) {
			this.beginGame();
		}

		while (!this.isGameOver()) {
			if (!this.hasBegunRound) {
				this.beginRound();
			}

			while (this.continueRound) {
				this.playTurn();
			}
			console.log("\n");
		}

		this.declareWinner();
	}

	private declareWinner(): void {
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

	private async createPlayer(playerName: string): Promise<Player> {
		try {
			let botFilePath: string;

			if (typeof window === "undefined") {
				// Backend (Node.js)
				// Comment out this block of code to work client-side
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
				// return new Promise(() => {});
			} else {
				// Frontend (Browser)

				if (!window.ts) {
					await new Promise((resolve, reject) => {
						const script = document.createElement("script");
						script.src = "https://cdn.jsdelivr.net/npm/typescript@latest/lib/typescript.min.js";
						script.onload = resolve;
						script.onerror = reject;
						document.head.appendChild(script);
					});
				}
				const ts = (window as any).ts;

				botFilePath = `/bots/${playerName}.ts`;

				const response = await fetch(botFilePath);
				if (!response.ok) {
					throw new Error(`Bot file ${playerName}.ts does not exist in frontend at ${botFilePath}!`);
				}
				const tsCode = await response.text();
				const processedCode = processImports(tsCode);
				const jsCode = ts.transpile(processedCode, {
					module: ts.ModuleKind.None,
					target: ts.ScriptTarget.ESNext,
				});

				const module = {};
				const functionBody = `
    				const exports = {};
    				${jsCode}
    				return exports;
  				`;
				const exportedModule = new Function("module", functionBody)(module);

				const BotClass = exportedModule.default || exportedModule[playerName];
				if (!BotClass) {
					throw new Error(`Bot file ${playerName} does not export a default or properly named class`);
				}

				const playerInstance = new BotClass();
				if (!(playerInstance instanceof Player)) {
					throw new Error(`Bot ${playerName}.ts does not extend Player!`);
				}

				return playerInstance;
			}
		} catch (error) {
			console.error(`Failed to load bot ${playerName}:`, error);
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

	private packagePublicInformation(currentAction: Action): PublicGameState {
		let orderedPlayers: PublicPlayer[] = [];
		let currentPlayerIndex: number = this.currentlyActing;
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

	public isGameOver(): boolean {
		let playerAliveCount: number = 0;
		for (let playerIndex: number = 0; playerIndex < this.players.length; playerIndex++) {
			if (!this.players[playerIndex].isDead) {
				playerAliveCount++;
			}
		}
		return playerAliveCount <= 1;
	}

	private resolveAction(action: Action): boolean {
		let isLastInPlay: boolean = true;
		for (let playerIndex: number = 0; playerIndex < this.players.length; playerIndex++) {
			if (this.currentlyActing !== playerIndex && !this.players[playerIndex].isDead && this.players[playerIndex].hand.cards.length > 0) {
				isLastInPlay = false;
			}
		}
		if (action.cardIndicesPlayed.length === 0 || isLastInPlay) {
			action.cardIndicesPlayed = [];
			console.log(`[Game ${this.gameId}]: ${isLastInPlay ? "Forced " : ""}${actionToString(action)}`);

			if (this.lastToAct === -1) {
				console.log(`[Game ${this.gameId}]: Player ${this.currentlyActing} challenged themselves!`);
				this.players[this.currentlyActing].shootSelf(this.config);
				if (!this.players[this.currentlyActing].isDead) {
					console.log(`[Game ${this.gameId}]: -- blank -- chamber: ${this.players[this.currentlyActing].currentChamber}`);
				} else {
					console.log(`[Game ${this.gameId}]: DEAD!`);
				}
				return false;
			}
			if (this.previousActorLying) {
				console.log(
					`[Game ${this.gameId}]: Player ${this.lastToAct} (${this.config.playerNames[this.lastToAct]} #${
						this.players[this.lastToAct].id
					}) lied and has to shoot themselves!`
				);
				this.players[this.lastToAct].shootSelf(this.config);
				if (!this.players[this.lastToAct].isDead) {
					console.log(`[Game ${this.gameId}]: -- blank -- chamber: ${this.players[this.lastToAct].currentChamber}`);
				} else {
					console.log(`[Game ${this.gameId}]: DEAD!`);
				}
			} else {
				console.log(
					`[Game ${this.gameId}]: Player ${this.lastToAct} (${this.config.playerNames[this.lastToAct]} #${
						this.players[this.lastToAct].id
					}) told the truth so player ${this.currentlyActing} has to shoot themselves!`
				);
				this.players[this.currentlyActing].shootSelf(this.config);
				if (!this.players[this.currentlyActing].isDead) {
					console.log(`[Game ${this.gameId}]: -- blank -- chamber: ${this.players[this.currentlyActing].currentChamber}`);
				} else {
					console.log(`[Game ${this.gameId}]: DEAD!`);
				}
			}

			return false;
		}

		let cardsPlayed: Card[] = this.players[this.currentlyActing].hand.playCards(action.cardIndicesPlayed);
		let isLie: boolean = false;
		for (let card of cardsPlayed) {
			if (card !== this.table && card !== Card.Joker) {
				isLie = true;
			}
		}

		console.log(`[Game ${this.gameId}]: ${actionToString(action)} (${isLie ? "lie" : "truth"})`);
		console.log(`[Game ${this.gameId}]: ${this.players[this.currentlyActing].hand.toString()}`);

		return isLie;
	}
}
