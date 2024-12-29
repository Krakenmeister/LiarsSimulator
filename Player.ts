import { Action } from "./Action";
import { GameConfiguration } from "./GameConfiguration";
import { Hand } from "./Hand";
import { PublicGameState } from "./PublicGameState";

export abstract class Player {
	public id: string;
	public currentChamber: number;
	public isDead: boolean;
	public hand: Hand;

	constructor() {
		this.id = Math.random().toFixed(6).toString().slice(2);

		this.isDead = false;
		this.currentChamber = 0;
		this.hand = new Hand();
	}

	public shootSelf(config: Readonly<GameConfiguration>): boolean {
		let bulletPosition: number = Math.floor(Math.random() * (config.chamberRounds - this.currentChamber));
		if (bulletPosition == 0 || this.currentChamber > config.chamberRounds) {
			this.isDead = true;
		}
		this.currentChamber++;
		return this.isDead;
	}

	public abstract takeAction(gameHistory: PublicGameState[]): Action;
}
