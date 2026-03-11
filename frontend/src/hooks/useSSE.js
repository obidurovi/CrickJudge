import { useEffect, useRef, useState, useCallback } from 'react';

const SSE_BASE = 'http://localhost:5000/api/sse';

/**
 * React hook for subscribing to Server-Sent Events.
 * 
 * @param {string} path - SSE endpoint path (e.g., '/matches', '/team/india?gender=male')
 * @param {Object} handlers - Map of event names to handler functions: { 'matches:update': (data) => {} }
 * @param {boolean} enabled - Whether the connection should be active (default: true)
 * @returns {{ connected: boolean, error: string|null, reconnectCount: number }}
 */
const useSSE = (path, handlers, enabled = true) => {
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);
    const [reconnectCount, setReconnectCount] = useState(0);
    const esRef = useRef(null);
    const handlersRef = useRef(handlers);
    const reconnectTimerRef = useRef(null);

    // Keep handlers ref up to date without triggering reconnections
    useEffect(() => {
        handlersRef.current = handlers;
    }, [handlers]);

    const connect = useCallback(() => {
        if (!enabled || !path) return;

        // Clean up existing connection
        if (esRef.current) {
            esRef.current.close();
            esRef.current = null;
        }

        const url = `${SSE_BASE}${path}`;
        const es = new EventSource(url);
        esRef.current = es;

        es.onopen = () => {
            setConnected(true);
            setError(null);
        };

        es.onerror = () => {
            setConnected(false);
            es.close();
            esRef.current = null;

            // Reconnect with exponential backoff (max 30s)
            const delay = Math.min(1000 * Math.pow(2, reconnectCount), 30000);
            setReconnectCount(prev => prev + 1);
            reconnectTimerRef.current = setTimeout(connect, delay);
        };

        // Listen for the 'connected' event from the server
        es.addEventListener('connected', () => {
            setConnected(true);
            setReconnectCount(0);
        });

        // Register all event handlers
        const currentHandlers = handlersRef.current;
        if (currentHandlers) {
            Object.keys(currentHandlers).forEach(eventName => {
                es.addEventListener(eventName, (e) => {
                    try {
                        const data = JSON.parse(e.data);
                        handlersRef.current[eventName]?.(data);
                    } catch {
                        // Non-JSON data, pass as string
                        handlersRef.current[eventName]?.(e.data);
                    }
                });
            });
        }
    }, [path, enabled, reconnectCount]);

    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
            }
            if (esRef.current) {
                esRef.current.close();
                esRef.current = null;
            }
            setConnected(false);
        };
    }, [path, enabled]); // Only reconnect when path or enabled changes

    return { connected, error, reconnectCount };
};

export default useSSE;
