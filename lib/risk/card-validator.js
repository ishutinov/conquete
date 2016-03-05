'use strict';

const constants = require('./contstants');
const JOKER_CARD = constants.JOKER_CARD;
const CARD_TYPES = constants.CARD_TYPES;

function cartesianProduct(elements) {
    if (!Array.isArray(elements)) {
        throw new TypeError();
    }

    let end = elements.length - 1;
    let result = [];

    function addTo(curr, start) {
        let first = elements[start],
            last = (start === end);

        for (let i = 0; i < first.length; ++i) {
            let copy = curr.slice();

            copy.push(first[i]);

            if (last) {
                result.push(copy);
            } else {
                addTo(copy, start + 1);
            }
        }
    }

    if (elements.length) {
        addTo([], 0);
    } else {
        result.push([]);
    }
    return result;
}

function findBonus (cardBonusOptions, types) {
    let highestBonus = 0;
    let highestBonusCombo = null;

    for (let bonusOption of cardBonusOptions) {
        let bonusCombo = bonusOption.cards;
        let remainingCards = bonusCombo.slice();
        let matchingCards = [];

        for (let type of types) {
            if (remainingCards.includes(type)) {
                matchingCards.push(type);
                remainingCards.splice(remainingCards.indexOf(type), 1);
            }
        }

        if (matchingCards.length === 3 && bonusOption.bonus > highestBonus) {
            highestBonus = bonusOption.bonus;
            highestBonusCombo = bonusOption;
        }
    }

    return highestBonusCombo;
}

function findJokerCombos (combo) {
    let possibleTypes = Object.keys(CARD_TYPES).map(type => {
        return CARD_TYPES[type];
    });

    let positions = [];

    for (let i = 0; i < combo.length; i++) {
        if (!positions[i]) {
            positions[i] = []
        }

        let type = combo[i];

        if (type === JOKER_CARD) {
            for (let pType of possibleTypes) {
                let copy = combo.slice().sort((a, b) => b - a);

                if (!positions[i].includes(pType)) {
                    positions[i].push(pType)
                }
            }
        } else {
            positions[i] = [type];
        }
    }

    return cartesianProduct(positions);
}

function getBonus (cardBonusOptions, cards) {
    let bonus = null;
    let types = cards.map(card => card.split('_')[0]);

    let combos = [types];

    if (types.includes(JOKER_CARD)) {
        combos = findJokerCombos(types);
    }

    let highestBonus = 0;
    let highestBonusCombo = null;

    for (let combo of combos) {
        let bonusCombo = findBonus(cardBonusOptions, combo);

        if (bonusCombo && bonusCombo.bonus > highestBonus) {
            highestBonus = bonusCombo.bonus;
            highestBonusCombo = bonusCombo;
        }
    }

    if (!highestBonusCombo) {
        throw new Error('Invalid card combination');
    }

    return highestBonus;
}

function isValidCombo (cardBonusOptions, cards) {
    try {
        getBonus(cardBonusOptions, cards);

        return true;
    } catch (err) {
        return false
    }
}

module.exports = {
    getBonus: getBonus,
    isValidCombo: isValidCombo
};