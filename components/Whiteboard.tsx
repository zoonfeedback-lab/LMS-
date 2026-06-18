'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Tldraw, Editor } from 'tldraw';
import 'tldraw/tldraw.css';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

const WHITEBOARD_TOPIC = 'whiteboard';
const DEBOUNCE_MS = 120;

export default function Whiteboard() {
  const room = useRoomContext();
  const editorRef = useRef<Editor | null>(null);
  const isRemoteUpdateRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localIdentityRef = useRef<string>('');

  // Store local identity for filtering own messages
  useEffect(() => {
    localIdentityRef.current = room.localParticipant.identity;
  }, [room]);

  // ── Broadcast local changes over data channel ──
  const broadcastChanges = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || isRemoteUpdateRef.current) return;

    try {
      const snapshot = editor.store.getStoreSnapshot();
      const payload = JSON.stringify({
        type: 'WB_SYNC',
        snapshot,
        sender: localIdentityRef.current,
      });

      const data = new TextEncoder().encode(payload);

      // Keep under 15KB limit for reliable delivery — if too large, skip
      if (data.byteLength > 14_000) {
        console.warn('Whiteboard snapshot too large, skipping broadcast');
        return;
      }

      room.localParticipant.publishData(data, {
        reliable: true,
        topic: WHITEBOARD_TOPIC,
      });
    } catch (err) {
      console.error('Failed to broadcast whiteboard state:', err);
    }
  }, [room]);

  // Debounced broadcast
  const scheduleBroadcast = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(broadcastChanges, DEBOUNCE_MS);
  }, [broadcastChanges]);

  // ── Listen for remote whiteboard data ──
  useEffect(() => {
    const handleDataReceived = (
      payload: Uint8Array,
      participant?: { identity: string } | undefined,
      _kind?: unknown,
      topic?: string
    ) => {
      if (topic !== WHITEBOARD_TOPIC) return;

      // Ignore own messages
      if (participant && participant.identity === localIdentityRef.current) return;

      const editor = editorRef.current;
      if (!editor) return;

      try {
        const text = new TextDecoder().decode(payload);
        const message = JSON.parse(text);

        if (message.type === 'WB_SYNC' && message.snapshot) {
          // Guard to prevent re-broadcasting remote patches
          isRemoteUpdateRef.current = true;
          editor.store.loadStoreSnapshot(message.snapshot);
          isRemoteUpdateRef.current = false;
        }
      } catch (err) {
        console.error('Failed to process remote whiteboard data:', err);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  // ── Mount tldraw editor ──
  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;

      // Listen for store changes and broadcast
      const removeListener = editor.store.listen(
        () => {
          if (!isRemoteUpdateRef.current) {
            scheduleBroadcast();
          }
        },
        { source: 'user', scope: 'document' }
      );

      // Cleanup on unmount is handled by tldraw internally;
      // we also store the unsubscribe for safety
      return () => {
        removeListener();
      };
    },
    [scheduleBroadcast]
  );

  return (
    <div className="whiteboard-container">
      <Tldraw onMount={handleMount} />
    </div>
  );
}
