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

const getSubscriber = C.applySpec({
  subscribe,
  unsubscribe
});

export default C.compose(
  getSubscriber,
  C.mandatoryProp("storage", new Error("No storage provided"))
);
