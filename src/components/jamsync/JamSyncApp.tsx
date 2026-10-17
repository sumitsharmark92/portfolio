"use client";

import React, { useEffect } from "react";
import { useJamSync } from "@/context/JamSyncContext";
import { JamSyncDashboard } from "./JamSyncDashboard";
import { RoomJoinModal } from "./RoomJoinModal";

interface JamSyncAppProps {
  initialRoomId?: string;
}

export const JamSyncApp: React.FC<JamSyncAppProps> = ({ initialRoomId }) => {
  const { roomId, joinRoom } = useJamSync();

  useEffect(() => {
    if (initialRoomId && !roomId) {
      joinRoom(initialRoomId);
    } else if (typeof window !== "undefined" && !roomId) {
      // Check pathname or query param for /jam/:roomId
      const match = window.location.pathname.match(/\/jam\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        joinRoom(match[1]);
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        const qRoom = urlParams.get("room");
        if (qRoom) joinRoom(qRoom);
      }
    }
  }, [initialRoomId, roomId, joinRoom]);

  if (!roomId) {
    return <RoomJoinModal initialRoomId={initialRoomId} />;
  }

  return <JamSyncDashboard />;
};
