import { useEffect, useRef, useState } from "react";

function getWsUrl() {
  if (typeof window === "undefined") return "ws://localhost/ws";
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const host = window.location.host;
  return `${proto}://${host}/ws`;
}

export function useWebSocket(onMessage: (data: unknown) => void) {
  const [ready, setReady] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(getWsUrl());
      wsRef.current = ws;
    } catch {
      setReady(false);
      wsRef.current = null;
      return;
    }

    ws.onopen = () => setReady(true);
    ws.onclose = () => setReady(false);
    ws.onerror = () => setReady(false);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current(data);
      } catch {
        // ignore non-JSON
      }
    };

    return () => {
      try {
        ws?.close();
      } catch {}
      wsRef.current = null;
    };
  }, []);

  const send = (msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  };

  return { ready, send };
}

