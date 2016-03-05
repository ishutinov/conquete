'use strict';

const Game = require('./Game');
const debug = require('debug')('risk:index');

const PHASE_METHODS = {
    [Game.PHASES.SETUP_A]: ['claimTerritory'],
    [Game.PHASES.SETUP_B]: ['deployOneUnit'],
    [Game.TURN_PHASES.PLACEMENT]: ['deployUnits', 'redeemCards', 'attackPhase', 'availableUnits'],
    [Game.TURN_PHASES.ATTACKING]: ['attack', 'fortifyPhase', 'rollDice'],
    [Game.TURN_PHASES.FORTIFYING]: ['moveUnits', 'endTurn']
};

const METHOD_ACCESS = {
    currentPlayer: ['deployUnits', 'redeemCards', 'attackPhase', 'attack', 'fortifyPhase', 'moveUnits', 'endTurn'],
    inBattle: ['rollDice']
};

function protectMethods (game, methods) {
    let wrappedMethods = {};

    Object.keys(methods).forEach(methodName => {
        let method = methods[methodName];

        Object.keys(PHASE_METHODS).forEach(phaseName => {
            let phaseMethods = PHASE_METHODS[phaseName];

            if (phaseMethods.includes(methodName)) {
                function wrappedMethod (playerId, ...args) {
                    let player = game.players.get(playerId);

                    if (game.isGameOver()) {
                        throw new Error('Game has ended');
                    }

                    if (game.phase === Game.PHASES.BATTLE && game.turn.phase !== phaseName) {
                        debug('attempted: ', methodName, playerId, args, game.phase, game.turn.phase, phaseName);
                        throw new Error('Not allowed in "' + game.phase + ' ' + game.turn.phase + '"');
                    } else if (game.phase !== Game.PHASES.BATTLE && game.phase !== phaseName) {
                        throw new Error('Not allowed in "' + game.phase + '"');
                    }

                    if (METHOD_ACCESS.inBattle.includes(methodName)) {
                        if (playerId !== game.turn.battle.turn.id) {
                            debug('attempted battle turn', playerId, methodName)
                            throw new Error('Not your turn');
                        }
                    } else if (METHOD_ACCESS.currentPlayer.includes(methodName)) {
                        if (playerId !== game.turn.player.id) {
                            debug('attempted turn', playerId, methodName)
                            throw new Error('Not your turn');
                        }
                    }

                    return method(...args);
                };

                wrappedMethods[methodName] = wrappedMethod;
            }
        });
    });

    return Object.assign({}, methods, wrappedMethods);
}

module.exports = function (players, options) {
    const game = new Game(players, options);

    let actMethods = protectMethods(game, {
        claimTerritory (territoryId) {
            let territory = game.board.territories.get(territoryId);

            if (!territory) {
                throw new Error('Invalid territory');
            }

            game.claimTerritory(territory);
        },

        deployOneUnit (territoryId) {
            let territory = game.board.territories.get(territoryId);

            if (!territory) {
                throw new Error('Invalid territory');
            }

            game.deployOneUnit(territory);
        },

        availableUnits () {
            return game.availableUnits();
        },

        deployUnits (territoryId, units) {
            let territory = game.board.territories.get(territoryId);

            if (!territory) {
                throw new Error('Invalid territory');
            }

            game.deployUnits(territory, Number.parseInt(units, 10));
        },

        redeemCards (...cardIds) {
            let cards = cardIds.map(cardId => game.cards.get(cardId));

            game.redeemCards(cards);
        },

        attackPhase () {
            game.attackPhase();
        },

        attack (fromTerritoryId, toTerritoryId, units) {
            let from = game.board.territories.get(fromTerritoryId);
            let to = game.board.territories.get(toTerritoryId);

            if (!from || !to) {
                throw new Error('Invalid territories');
            }

            game.attack(from, to, Number.parseInt(units, 10));
        },

        rollDice (numberOfDice) {
            game.rollDice(numberOfDice);
        },

        fortifyPhase () {
            game.fortifyPhase();
        },

        moveUnits (fromTerritoryId, toTerritoryId, units) {
            let from = game.board.territories.get(fromTerritoryId);
            let to = game.board.territories.get(toTerritoryId);

            game.moveUnits(from, to, Number.parseInt(units, 10));
        },

        endTurn () {
            game.endTurn();
        },

        cards () {
            return Array.from(game.turn.player.cards).map(card => card.id);
        }
    });

    let infoMethods = {
        areCardsValid (cardIds) {
            let cards = cardIds.map(cardId => game.cards.get(cardId));

            return game.cardSet.isValidCombination(cards);
        },

        get results () {
            let winner = game.winner();

            return {
                winner: winner ? winner.id : null
            };
        },

        get availableTerritories () {
            let mapped = {};

            for (let territory of game.board.territories.values()) {
                if (!territory.occupyingPlayer) {
                    mapped[territory.id] = territory;
                }
            }

            return mapped;
        },

        get territories () {
            let mapped = {};

            for (let territory of game.board.territories.values()) {
                mapped[territory.id] = territory.toJSON();
            }

            return mapped;
        },

        get battle () {
            if (!game.turn.battle) {
                return null;
            }

            let battle = game.turn.battle;

            return {
                players: [battle.attacker.id, battle.defender.id],
                currentPlayer: battle.turn.id,
                attacker: {
                    player: battle.attacker.id,
                    units: battle.attackUnits,
                    dice: battle.attackDice
                },
                defender: {
                    player: battle.defender.id,
                    units: battle.defendUnits,
                    dice: battle.defendDice
                },
                from: battle.from.id,
                to: battle.to.id,
            };
        },

        get continents () {
            return Array.from(game.board.continents.values()).map(continent => continent.toJSON());
        },

        get PHASES () {
            return Game.PHASES;
        },

        get TURN_PHASES () {
            return Game.TURN_PHASES;
        },

        get phase () {
            return game.phase;
        },

        get turnPhase () {
            return game.turn.phase || null
        },

        get players () {
            return Array.from(game.players.values()).map(player => {
                let territories = Array.from(game.board.territories.values()).filter(territory => {
                    return territory.occupyingPlayer === player;
                }).map(territory => territory.id);

                let continents = Array.from(game.board.continents.values()).filter(continent => {
                    return continent.occupyingPlayer === player;
                }).map(continent => continent.id);

                let result = Object.assign(player.toJSON(), {
                    territories: territories,
                    continents: continents
                });

                // TODO make this nicer. Other players should not see cards
                delete result.cards;

                return result;
            });
        }
    };

    return {
        start: () => game.start(),

        hasGameEnded: () => game.isGameOver(),

        get currentPlayer () {
            // TODO abstract this away
            let territories = Array.from(game.board.territories.values()).filter(territory => {
                return territory.occupyingPlayer === game.turn.player;
            }).map(territory => territory.id);

            let continents = Array.from(game.board.continents.values()).filter(continent => {
                return continent.occupyingPlayer === game.turn.player;
            }).map(continent => continent.id);

            let result = Object.assign(game.turn.player.toJSON(), {
                territories: territories,
                continents: continents
            });

            // TODO make this nicer. Other players should not see cards
            delete result.cards;

            return result;
        },

        info: infoMethods,
        act: actMethods
    };
};