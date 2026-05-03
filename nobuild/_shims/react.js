// Shim ESM pour React (qui est CJS) : ré-exporte explicitement les named
// exports pour qu'ils soient visibles côté bundle.
import React from 'react'
export default React
export const {
  StrictMode, Fragment, Component, PureComponent, Suspense, Profiler,
  Children, createElement, cloneElement, isValidElement, createContext,
  forwardRef, memo, lazy, startTransition, version,
  useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef,
  useReducer, useImperativeHandle, useContext, useDebugValue, useId,
  useTransition, useDeferredValue, useSyncExternalStore, useInsertionEffect,
  useActionState, useOptimistic, use,
} = React
