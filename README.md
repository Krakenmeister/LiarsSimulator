# Liar's Simulator

A console-based simulator for the popular game [Liar's Bar](https://store.steampowered.com/app/3097560/Liars_Bar/) built in Typescript. Accompanying web-application UI visualization coming soon. Planned for an open script-writing competition.

New scripts/strategies can be created in the bots folder and extend the Player class. A well-documented example can be found in bots/Example.ts. Run a simulation from Simulator.ts, and place the desired configuration settings there as well.

## Installation Instructions

1. Install [git](https://git-scm.com/downloads) and clone the repository with `git clone https://github.com/Krakenmeister/LiarsSimulator.git`

2. Install [nodejs](https://nodejs.org/en/download)

3. Install the [tsx package](https://www.npmjs.com/package/tsx) via npm with the command `npm install tsx`

4. Run Simulator.ts with `tsx Simulator.ts`

## Example Output

```
[Game 79909]: Round 3, Queen's Table


[Game 79909]: Turn 0
[Game 79909]: Player 0's turn (Random #623059)
[Game 79909]: Current chamber = 0
[Game 79909]: K K K J Q
[Game 79909]: Playing card 0 (lie)
[Game 79909]: K K J Q


[Game 79909]: Turn 1
[Game 79909]: Player 1's turn (Random #072047)
[Game 79909]: Current chamber = 2
[Game 79909]: K A A Q K
[Game 79909]: Playing card 0 (lie)
[Game 79909]: A A Q K


[Game 79909]: Turn 2
[Game 79909]: Player 2's turn (Random #198534)
[Game 79909]: Current chamber = 0
[Game 79909]: A Q K Q A
[Game 79909]: Playing card 0 (lie)
[Game 79909]: Q K Q A


[Game 79909]: Turn 3
[Game 79909]: Player 3's turn (Random #405899)
[Game 79909]: Current chamber = 1
[Game 79909]: A Q A Q J
[Game 79909]: Challenge!
[Game 79909]: Player 2 (Random #198534) lied and has to shoot themselves!
[Game 79909]: DEAD!
```
