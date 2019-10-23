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

export default C.compose(
  C.applySpec({
    subscribe,
    unsubscribe
  }),
  C.mandatoryProp("storage", new Error("No storage provided"))
);
