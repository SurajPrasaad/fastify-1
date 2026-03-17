export const createSerializable = (v) => v;
export const version = "0.5.1";
export const isSerializableRef = (v) => false;
export const isWorkletFunction = (v) => false;
export const runOnJS = (v) => v;
export const runOnUI = (v) => v;
export const makeShareable = (v) => v;
export const isShareableRef = (v) => false;
export const makeShareableCloneRecursive = (v) => v;
export const makeShareableCloneOnUIRecursive = (v) => v;
export const shareableMappingCache = new Map();
export const getStaticFeatureFlag = () => false;
export const setDynamicFeatureFlag = () => {};
export const isSynchronizable = (v) => false;
export const getRuntimeKind = () => 'unknown';
export const RuntimeKind = { JS: 'JS', UI: 'UI', unknown: 'unknown' };
export const createWorkletRuntime = () => ({});
export const runOnRuntime = (r, f) => f();
export const serializableMappingCache = new Map();
export const createSynchronizable = (v) => v;
export const callMicrotasks = () => {};
export const executeOnUIRuntimeSync = (f) => f();
export const runOnUIAsync = (f) => f();
export const runOnUISync = (f) => f();
export const scheduleOnRN = (f) => f();
export const scheduleOnUI = (f) => f();
export const unstable_eventLoopTask = (f) => f();
export const WorkletsModule = {};

export const Worklets = {
  version: "0.5.1",
};

export default {
  createSerializable,
  isSerializableRef,
  isWorkletFunction,
  runOnJS,
  runOnUI,
  makeShareable,
  isShareableRef,
  makeShareableCloneRecursive,
  makeShareableCloneOnUIRecursive,
  shareableMappingCache,
  getStaticFeatureFlag,
  setDynamicFeatureFlag,
  isSynchronizable,
  getRuntimeKind,
  RuntimeKind,
  createWorkletRuntime,
  runOnRuntime,
  serializableMappingCache,
  createSynchronizable,
  callMicrotasks,
  executeOnUIRuntimeSync,
  runOnUIAsync,
  runOnUISync,
  scheduleOnRN,
  scheduleOnUI,
  unstable_eventLoopTask,
  WorkletsModule,
  Worklets,
};
