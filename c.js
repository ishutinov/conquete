var c = require('./lib/risk/card-validator');
var opt = [ {
        cards: ['cavalry', 'artillery', 'infantry'],
        bonus: 10
    },
    {
        cards: ['artillery', 'artillery','artillery'],
        bonus: 8,
    },
    {
        cards: ['cavalry', 'cavalry','cavalry'],
        bonus: 6,
    },
    {
        cards: ['infantry', 'infantry','infantry'],
        bonus: 4,
    }
];

console.log(c(opt, ['joker_d', 'joker_4', 'joker_66']));