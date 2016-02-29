'use strict';

const debug = require('debug')('risk:Battle');

function rollDice(numberOfDice) {
    let results = [];

    for (let i = 0; i < numberOfDice; i++) {
        let result = Math.floor(Math.random() * 6) + 1;

        results.push(result);
    }

    return results.sort((a, b) => {
        return b - a;
    });
}

class Battle {
    constructor (attackingTerritory, defendingTerritory, units) {
        this.from = attackingTerritory;
        this.to = defendingTerritory;

        this.initialAttackUnits = units;
        this.attackUnits = units;
        this.defendUnits = this.to.units;

        this.attacker = attackingTerritory.occupyingPlayer;
        this.defender = defendingTerritory.occupyingPlayer;

        this.turn = this.from.occupyingPlayer;

        this.attackDice = [];
        this.defendDice = [];

        this.winner = null;

        debug('battle initiated %o', {
            attacker: this.attacker.id,
            defender: this.defender.id
        });
    }

    attackThrow (numberOfDice) {
        if (this.turn !== this.from.occupyingPlayer) {
            throw new Error('Not your turn');
        }

        if (numberOfDice > 3) {
            throw new Error('No more than 3 dice');
        }

        if (numberOfDice > this.attackUnits) {
            throw new Error('Not enough units left to throw with ' + numberOfDice + ' dices');
        }

        this.attackDice = rollDice(numberOfDice);
        this.turn = this.to.occupyingPlayer;

        debug('attacker rolled dice', this.attackDice);
    }

    defendThrow (numberOfDice) {
        if (this.turn !== this.to.occupyingPlayer) {
            throw new Error('Not your turn');
        }

        if (numberOfDice > 2) {
            throw new Error('No more than 2 dice');
        }

        if (numberOfDice > this.defendingUnits) {
            throw new Error('Not enough units left to throw with ' + numberOfDice + ' dices');
        }

        this.defendDice = rollDice(numberOfDice);

        debug('defender rolled dice', this.defendDice);

        this._compareResult();
    }

    _compareResult () {
        let attackKilled = 0;
        let defendKilled = 0;

        for (let i = 0; i < this.defendDice.length; i++) {
            let defendDice = this.defendDice[i];
            let attackDice = this.attackDice[i];

            if (defendDice >= attackDice) {
                attackKilled += 1;
            } else {
                defendKilled += 1;
            }
        }

        this.attackUnits -= attackKilled;
        this.defendUnits -= defendKilled;

        debug('dice throw results %o', {
            attackRemaining: this.attackUnits,
            defendRemaining: this.defendUnits,
            attackKilled: attackKilled,
            defendKilled: defendKilled
        });

        if (this.attackUnits <= 0) {
            this.winner = this.to;
            debug('defender won');
        } else if (this.defendUnits <= 0) {
            this.winner = this.from;
            debug('attacker won');
        }

        if (this.winner) {
            this._endBattle();
        } else {
            this.turn = this.from.occupyingPlayer;
        }
    }

    isBattleOver () {
        return this.winner ? true : false;
    }

    _endBattle () {
        if (this.winner === this.from) {
            this.to.occupyingPlayer = this.from.occupyingPlayer;
            this.to.units = this.attackUnits;
        } else if (this.winner === this.to) {
            this.from.units -= this.initialAttackUnits;
        } else {
            throw new Error('No winner');
        }
    }
}

module.exports = Battle;