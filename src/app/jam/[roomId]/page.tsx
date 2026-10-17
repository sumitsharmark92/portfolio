"use client";

import React from "react";
import { JamSyncProvider } from "@/context/JamSyncContext";
import { JamSyncApp } from "@/components/jamsync/JamSyncApp";

export default function JamRoomPage({ params }: { params: { roomId: string } }) {
  return (
    <JamSyncProvider>
      <JamSyncApp initialRoomId={params.roomId} />
    </JamSyncProvider>
  );
}
