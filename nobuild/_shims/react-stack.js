// Bundle unique React + ReactDOM. Tous les sous-modules vendorés
// (vendor/react.js, vendor/react-jsx-runtime.js, vendor/react-dom-client.js)
// ré-exportent depuis ce fichier — donc une SEULE instance de React.
import React from 'react'
import * as RJSX from 'react/jsx-runtime'
import * as RDOM from 'react-dom/client'

const R = React
const J = RJSX.default ?? RJSX
const D = RDOM.default ?? RDOM

export const ReactDefault = R
export const ReactNamed = {
  StrictMode: R.StrictMode, Fragment: R.Fragment, Component: R.Component,
  PureComponent: R.PureComponent, Suspense: R.Suspense, Profiler: R.Profiler,
  Children: R.Children, createElement: R.createElement, cloneElement: R.cloneElement,
  isValidElement: R.isValidElement, createContext: R.createContext,
  forwardRef: R.forwardRef, memo: R.memo, lazy: R.lazy,
  startTransition: R.startTransition, version: R.version,
  useState: R.useState, useEffect: R.useEffect, useLayoutEffect: R.useLayoutEffect,
  useMemo: R.useMemo, useCallback: R.useCallback, useRef: R.useRef,
  useReducer: R.useReducer, useImperativeHandle: R.useImperativeHandle,
  useContext: R.useContext, useDebugValue: R.useDebugValue, useId: R.useId,
  useTransition: R.useTransition, useDeferredValue: R.useDeferredValue,
  useSyncExternalStore: R.useSyncExternalStore, useInsertionEffect: R.useInsertionEffect,
  useActionState: R.useActionState, useOptimistic: R.useOptimistic, use: R.use,
}
export const JSXRuntime = { jsx: J.jsx, jsxs: J.jsxs, Fragment: J.Fragment }
export const ReactDOMClient = { createRoot: D.createRoot, hydrateRoot: D.hydrateRoot }
