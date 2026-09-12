"use client";
import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import SimplePeer from "simple-peer";
import { supabase } from "@/lib/supabase";

export interface CallProps {
  teamId: number;
  isInitiator: boolean;
  onUserJoined?: (userId: number) => void;
  onUserLeft?: (userId: number) => void;
  onActiveSpeakersChange?: (speakerIds: number[]) => void;
  onScreenShareStart?: () => void;
  onScreenShareStop?: () => void;
}

export const remoteStreamsMap = new Map<number, { stream: MediaStream; type: 'video' | 'audio' }>();
export const peerRefsMap = new Map<number, SimplePeer.Instance>();
export const audioAnalyzersMap = new Map<number, { analyser: AnalyserNode; data: Uint8Array }>();

const CallManager = forwardRef(({
  teamId,
  isInitiator,
  onUserJoined,
  onUserLeft,
  onActiveSpeakersChange,
  onScreenShareStart,
  onScreenShareStop
}: CallProps, ref) => {
  const localStreamRef = useRef<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [activeSpeakers, setActiveSpeakers] = useState<number[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useImperativeHandle(ref, () => ({
    startCall,
    endCall,
    isCallActive,
    activeSpeakers,
    isScreenSharing,
    error
  }));

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn("AudioContext not supported");
      }
    }
    return audioContextRef.current;
  }, []);

  const initializePeer = useCallback((userId: number, isInitiatorParam: boolean) => {
    try {
      if (!localStreamRef.current) return null;

      const peer = new SimplePeer({
        initiator: isInitiatorParam,
        trickle: false,
        stream: localStreamRef.current,
        config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }
      });

      peer.on("signal", (data: any) => {
        supabase.channel(`webrtc-signals:${teamId}`).send({
          type: "broadcast",
          event: "webrtc-signal",
          payload: {
            senderId: 1,
            type: data.type === "signal" ? "offer" : data.type,
            payload: data
          }
        });
      });

      peer.on("stream", (stream: MediaStream) => {
        const hasVideo = stream.getVideoTracks().length > 0;
        remoteStreamsMap.set(userId, { stream, type: hasVideo ? 'video' : 'audio' });
        peerRefsMap.set(userId, peer);
        
        if (stream.getAudioTracks().length > 0) {
          setupAudioAnalysis(userId, stream);
        }
        
        updateActiveSpeakers();
        onUserJoined?.(userId);
      });

      peer.on("close", () => {
        remoteStreamsMap.delete(userId);
        audioAnalyzersMap.delete(userId);
        peerRefsMap.delete(userId);
        updateActiveSpeakers();
        onUserLeft?.(userId);
      });

      peer.on("error", (err: any) => {
        console.error(`Peer error with ${userId}:`, err);
        peerRefsMap.delete(userId);
      });

      return peer;
    } catch (err) {
      console.error("Peer initialization error:", err);
      return null;
    }
  }, [teamId, onUserJoined, onUserLeft]);

  const setupAudioAnalysis = useCallback((userId: number, stream: MediaStream) => {
    const audioContext = getAudioContext();
    if (!audioContext) return;
    
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    audioAnalyzersMap.set(userId, { analyser, data: dataArray });
  }, [getAudioContext]);

  const updateActiveSpeakers = useCallback(() => {
    const speakerCandidates: Array<{ id: number; level: number }> = [];
    
    audioAnalyzersMap.forEach(({ analyser, data }, userId) => {
      try {
        // @ts-expect-error TypeScript array buffer type mismatch
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          sum += Math.abs(data[i] - 128);
        }
        const rms = sum / data.length;
        speakerCandidates.push({ id: userId, level: rms });
      } catch (e) {
      }
    });

    speakerCandidates.sort((a, b) => b.level - a.level);
    const newActiveSpeakers = speakerCandidates
      .filter(c => c.level > 0.05)
      .slice(0, 4)
      .map(c => c.id);

    if (JSON.stringify(newActiveSpeakers) !== JSON.stringify(activeSpeakers)) {
      setActiveSpeakers(newActiveSpeakers);
      onActiveSpeakersChange?.(newActiveSpeakers);
    }
  }, [activeSpeakers, onActiveSpeakersChange]);

  const startLocalMedia = async (options: { video: boolean; audio: boolean; screen: boolean }) => {
    try {
      let stream: MediaStream;
      if (options.screen) {
        const anyNav = navigator as any;
        stream = await anyNav.mediaDevices.getDisplayMedia({
          video: true,
          audio: options.audio
        });
        setIsScreenSharing(true);
        onScreenShareStart?.();
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: options.video,
          audio: options.audio
        });
        setIsScreenSharing(false);
        onScreenShareStop?.();
      }
      localStreamRef.current = stream;
      
      if (stream.getAudioTracks().length > 0) {
        setupAudioAnalysis(1, stream);
      }
      
      return stream;
    } catch (err: any) {
      console.error("Media access error:", err);
      if (err.name === "NotAllowedError") {
        throw new Error("Please allow camera/microphone access");
      }
      if (err.name === "NotFoundError") {
        throw new Error("No camera or microphone found");
      }
      throw err;
    }
  };

  const startCall = async (mediaOptions: { video: boolean; audio: boolean; screen: boolean }) => {
    setError(null);
    try {
      await startLocalMedia(mediaOptions);
      setIsCallActive(true);
    } catch (err) {
      console.error("Call start error:", err);
      setError(err instanceof Error ? err.message : "Failed to start call");
      throw err;
    }
  };

  const endCall = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    peerRefsMap.forEach(peer => peer.destroy());
    peerRefsMap.clear();
    remoteStreamsMap.clear();
    audioAnalyzersMap.clear();
    setIsCallActive(false);
    setActiveSpeakers([]);
    setIsScreenSharing(false);
    audioContextRef.current?.close();
    audioContextRef.current = null;
    onScreenShareStop?.();
  }, [onScreenShareStop]);

  useEffect(() => {
    const signalingChannel = supabase
      .channel(`webrtc-signals:${teamId}`)
      .on(
        "broadcast",
        { event: "webrtc-signal" },
        (payload) => {
          const { senderId, type, payload: signalData } = payload.payload;
          if (senderId === 1) return;

          let peer: SimplePeer.Instance | undefined | null = peerRefsMap.get(senderId);
          if (!peer) {
            peer = initializePeer(senderId, false);
          }
          peer?.signal(signalData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(signalingChannel);
    };
  }, [teamId, initializePeer]);

  return null;
});

CallManager.displayName = 'CallManager';
export default CallManager;