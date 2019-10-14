import memoryStorage from "./storage/memory";
import postgresStorage from "./storage/postgres";
import subscriberCreator from "./modules/subscriber";
import notifierCreator from "./modules/notifier";

export const createMemoryStorage = memoryStorage;
export const createPostgresStorage = postgresStorage;
export const createSubscriber = subscriberCreator;
export const createNotifier = notifierCreator;
