import * as C from "./composition";

const validateMandatoryProp = name =>
  C.mandatoryProp(
    name,
    new Error(`invalid subscription: "${name}" field is missing`)
  );

const subscribe = ({ storage }) =>
  C.compose(
    subscription => storage.add(subscription),
    validateMandatoryProp("event"),
    validateMandatoryProp("target")
  );

const unsubscribe = ({ storage }) => id => storage.remove(id);

/**
 * Subscriber is created providing an storage. Subscribar has two methos, `subscribe` and `unsubscribe`.
 * The `subscribe` method expect one single argument that is the subscription object which should contain the event field and the target field, optionally you can privide the criteria field with a condition to evaluate the event payload. This criteria support a mongodb where clause style. The `unsubscribe` method expect the subscription id, whichi is privided by the `subscribe` method.
 */
export default C.compose(
  C.applySpec({
    subscribe,
    unsubscribe
  }),
  C.mandatoryProp("storage", new Error("No storage provided"))
);
