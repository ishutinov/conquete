'use strict';

class Queue {
    constructor (items) {
        this.items = items ? items.slice() : [];
    }

    push (card) {
        this.items.push(card);
    }

    pop () {
        return this.items.shift();
    }

    shuffle () {
        let counter = this.items.length;

        while (counter > 0) {
            let index = Math.floor(Math.random() * counter);

            counter -= 1;

            let temp = this.items[counter];

            this.items[counter] = this.items[index];
            this.items[index] = temp;
        }
    }
}

module.exports = Queue;