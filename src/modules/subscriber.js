import { mandatoryProp, compose, applySpec } from "./composition";

const validateMandatoryProp = name =>
  mandatoryProp(
    name,
    new Error(`invalid subscription: "${name}" field is missing`)
  );

const subscribe = ({ storage }) =>
  compose(
    subscription => storage.add(subscription),
    validateMandatoryProp("event"),
    validateMandatoryProp("target")
  );

const unsubscribe = ({ storage }) => id => storage.remove(id);

const getSubscriber = applySpec({
  subscribe,
  unsubscribe
});

export default compose(
  getSubscriber,
  mandatoryProp("storage", new Error("No storage provided"))
);
