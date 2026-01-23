'use client';

import { LandingPortal } from '@/components/LandingPortal';
import { RouteAnnouncer } from '@/components/RouteAnnouncer';
import { DynamicBackground } from '@/components/Player/DynamicBackground';
import { GrainOverlay } from '@/components/GrainOverlay';
import { useRoomStore } from '@/store/useRoomStore';

export default function Home() {
  const { isJoining, isConnected } = useRoomStore();

  return (
    <>
      <RouteAnnouncer isVisible={isJoining} status={isConnected ? 'syncing' : 'connecting'} />
      <DynamicBackground />
      <GrainOverlay />
      <LandingPortal />
    </>
  );
}
