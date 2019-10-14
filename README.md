# subscribe-me

[![Generated with nod](https://img.shields.io/badge/generator-nod-2196F3.svg?style=flat-square)](https://github.com/diegohaz/nod)
[![NPM version](https://img.shields.io/npm/v/subscribe-me.svg?style=flat-square)](https://npmjs.org/package/subscribe-me)
[![Build Status](https://img.shields.io/travis/yaplas/subscribe-me/master.svg?style=flat-square)](https://travis-ci.org/yaplas/subscribe-me) [![Coverage Status](https://img.shields.io/codecov/c/github/yaplas/subscribe-me/master.svg?style=flat-square)](https://codecov.io/gh/yaplas/subscribe-me/branch/master)

Events subscriptions CRUD and dispatcher. In an event driven microservices architecture it helps to keep generic events but specific subscriptions.

## Install

npm:

    npm i subscribe-me

Yarn:

    yarn add subscribe-me

## Usage

```js
import {createMemoryStorage, createSubscriber, createNotifier} from "subscribe-me";
import { from } from "rxjs";

// postgres storage coming soon
const storage = createMemoryStorage();
const subscriber = createSubscriber({storage});

// on other storage except memory this method is async
const id = subscriber.subscribe({
    event: "value-change",
    target: "my-api.com/my-endpoint",
    // you can specify a criteria for the event payload
    // it supports mongodb where clause style
    criteria: { previous: { $gte: 50 }, current: { $lt: 50 } }
});

const notifier = createNotifier({storage});

// getNotification method accept a rxjs stream of events and return a rxjs stream of notifications
const notifications = notifier.getNotifications(
    from([
        // given the subscription criteria this event should be ignored
        {type: "value-change", payload: { previous: 60, current: 54 } },
        // this event should trigger a notification
        {type: "value-change", payload: { previous: 54, current: 49 } },
    ])
);

// dispatch notification to console log
// this subscribe is the rxjs Observable subscribe mejthod
notifications.subscribe(console.log);

// you can unsubscribe from the event using the subscription id
subscriber.unsubscribe(id);
```

## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### Table of Contents

Coming soon

## License

MIT © [Agustin Lascialandare](https://github.com/yaplas)
