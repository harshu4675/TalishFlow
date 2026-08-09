import { createContext, useContext, useCallback, useRef } from "react";
import { useReducer } from "react";
import { generateId } from "@/utils/helpers";

// ============================================================
// Notification Types
// ============================================================

export const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
  PROGRESS: "progress",
};

// ============================================================
// Reducer
// ============================================================

function notificationReducer(state, action) {
  switch (action.type) {
    case "ADD":
      return [...state, action.payload];

    case "REMOVE":
      return state.filter((n) => n.id !== action.payload);

    case "UPDATE":
      return state.map((n) =>
        n.id === action.payload.id ? { ...n, ...action.payload.updates } : n,
      );

    case "CLEAR_ALL":
      return [];

    default:
      return state;
  }
}

// ============================================================
// Context
// ============================================================

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, dispatch] = useReducer(notificationReducer, []);
  const timers = useRef({});

  const remove = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    dispatch({ type: "REMOVE", payload: id });
  }, []);

  const add = useCallback(
    ({
      type,
      title,
      message,
      duration = 5000,
      persistent = false,
      meta = {},
    }) => {
      const id = generateId("toast");

      const notification = {
        id,
        type,
        title,
        message,
        meta,
        persistent,
        createdAt: Date.now(),
      };

      dispatch({ type: "ADD", payload: notification });

      if (!persistent && duration !== Infinity) {
        timers.current[id] = setTimeout(() => remove(id), duration);
      }

      return id;
    },
    [remove],
  );

  const success = useCallback(
    (title, message, options = {}) =>
      add({ type: NOTIFICATION_TYPES.SUCCESS, title, message, ...options }),
    [add],
  );

  const error = useCallback(
    (title, message, options = {}) =>
      add({
        type: NOTIFICATION_TYPES.ERROR,
        title,
        message,
        duration: 7000,
        ...options,
      }),
    [add],
  );

  const warning = useCallback(
    (title, message, options = {}) =>
      add({ type: NOTIFICATION_TYPES.WARNING, title, message, ...options }),
    [add],
  );

  const info = useCallback(
    (title, message, options = {}) =>
      add({ type: NOTIFICATION_TYPES.INFO, title, message, ...options }),
    [add],
  );

  const progress = useCallback(
    (title, message, options = {}) =>
      add({
        type: NOTIFICATION_TYPES.PROGRESS,
        title,
        message,
        persistent: true,
        ...options,
      }),
    [add],
  );

  const update = useCallback((id, updates) => {
    dispatch({ type: "UPDATE", payload: { id, updates } });
  }, []);

  const clearAll = useCallback(() => {
    Object.values(timers.current).forEach(clearTimeout);
    timers.current = {};
    dispatch({ type: "CLEAR_ALL" });
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        add,
        remove,
        success,
        error,
        warning,
        info,
        progress,
        update,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotificationContext must be used within NotificationProvider",
    );
  }

  return context;
}
