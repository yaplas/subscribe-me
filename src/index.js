import memoryStorage from "./storage/memory";
import postgresStorage from "./storage/postgres";
import subscriberCreator from "./modules/subscriber";
import notifierCreator from "./modules/notifier";

/**
 * Creates a memory storage, it is used just for tesnting and experiments.
 * @returns {Object} the storage to be used to create a notifier or a subscriber.
 */
export const createMemoryStorage = memoryStorage;

/**
 * Creates PostgreSQL storage.
 * @param {Object} options Postgres configuration
 * @param {string} options.user db user
 * @param {string} options.password db user password
 * @param {string} options.host db host
 * @param {number} options.port db host
 * @param {string} options.database db name
 * @param {Object} options.pool or you can provide just a connection pool instance instead of the previous settings
 * @param {number} [options.chunkSize=1000] the chunk size
 * @param {string} [options.table="event_subscriptions"] subscription table name
 * @returns {Object} The storage to be used to create a notifier or a subscriber.
 */
export const createPostgresStorage = postgresStorage;

/**
 * Create the suubscriber.
 * @param {Object} options configuration options
 * @param {Object} options.storage storage object (e.g. memory storage)
 * @returns The subscriber with the `subscribe` and `unsubscribe` methods.
 */
export const createSubscriber = subscriberCreator;

/**
 * Creates the notifier.
 * @param {Object} options configuration options
 * @param {Object} options.storage storage object (e.g. memory storage)
 * @param {number} options.bufferMilliseconds setup an event time buffer, useful to reduce significantly the amount of subscription storage accesses
 * @returns The notifier with the `getNotification` method, it receive the input event stream and return the notification event stream (rxjs observable)
 */
export const createNotifier = notifierCreator;
