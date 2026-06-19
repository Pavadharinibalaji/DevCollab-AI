"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

import { disconnectSocketClient, getSocketClient, type SocketClientOptions } from "@/lib/socket/socket-client";

export type UseSocketOptions = SocketClientOptions & {
  /** When set, joins the project room after connect */
  projectId?: string;
  /** If true, disconnects and clears singleton on unmount (default false for shared socket) */
  disconnectOnUnmount?: boolean;
};

export type UseSocketResult = {
  socket: Socket | null;
  isConnected: boolean;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
};

/**
 * Reusable hook for Socket.IO in React.
 * Uses the singleton client from `getSocketClient` to avoid duplicate connections.
 */
export function useSocket(options: UseSocketOptions = {}): UseSocketResult {
  const { projectId, disconnectOnUnmount = false, url, path, socketOptions } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const socketOptionsRef = useRef(socketOptions);

  useEffect(() => {
    socketOptionsRef.current = socketOptions;
  }, [socketOptions]);

  const joinProject = useCallback((pid: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit("join-project", pid);
  }, []);

  const leaveProject = useCallback((pid: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit("leave-project", pid);
  }, []);

  useEffect(() => {
    const client = getSocketClient({ url, path, socketOptions: socketOptionsRef.current });
    socketRef.current = client;
    setSocket(client);

    if (!client) {
      return;
    }

    const onConnect = () => {
      setIsConnected(true);
      if (projectId) {
        joinProject(projectId);
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    client.on("connect", onConnect);
    client.on("disconnect", onDisconnect);
    setIsConnected(client.connected);
    if (client.connected && projectId) {
      joinProject(projectId);
    }

    return () => {
      client.off("connect", onConnect);
      client.off("disconnect", onDisconnect);
      if (projectId) {
        leaveProject(projectId);
      }
      if (disconnectOnUnmount) {
        disconnectSocketClient();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [disconnectOnUnmount, joinProject, leaveProject, projectId, url, path]);

  return {
    socket,
    isConnected,
    joinProject,
    leaveProject,
  };
}
