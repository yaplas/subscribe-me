import memoryStorage from "./storage/memory";
import postgresStorage from "./storage/postgres";
import subscriberCreator from "./modules/subscriber";
import notifierCreator from "./modules/notifier";

/**
 * Creates a memory storage, it is used just for tesnting and experiments.
 * @returns the storage to be used to create a notifier or a subscriber.
 */
export const createMemoryStorage = memoryStorage;

/**
 * Creates PostgreSQL storage.
 * @param options Postgres connection configuration plus optionally: chunkSize and table name.
 * @returns The storage to be used to create a notifier or a subscriber.
 */
export const createPostgresStorage = postgresStorage;

/**
 * Create the suubscriber.
 * @param options { storage }
 * @returns The subscriber with the `subscribe` and `unsubscribe` methods.
 */
export const createSubscriber = subscriberCreator;

/**
 * Creates the notifier.
 * @param options { storage }
 * @returns The notifier with the `getNotification` method, it receive the input event stream and return the notification event stream (rxjs observable)
 */
export const createNotifier = notifierCreator;
