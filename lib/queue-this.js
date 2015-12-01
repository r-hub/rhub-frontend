var amqp = require('amqplib');
var when = require('when');

var broker_url = process.env.RABBITMQ_URL ||
    'amqp://q.rhub.me:5672/rhub';

function queue_this(q, item) {

    amqp.connect(broker_url).then(function(conn) {
        return when(conn.createChannel().then(function(ch) {
            var ok = ch.assertQueue(q, { durable: true });

	    item.added_at = new Date().toISOString();

            return ok.then(function() {
                var msg = JSON.stringify(item);
                ch.sendToQueue(q, new Buffer(msg), { deliveryMode: true });
                return ch.close();
            });
        })).ensure(function() { conn.close(); });
    }).then(null, console.warn);
}

module.exports = queue_this;
