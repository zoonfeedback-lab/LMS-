'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import {
  BarChart3,
  Send,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
} from 'lucide-react';

const POLL_TOPIC = 'poll';

interface PollData {
  pollId: string;
  question: string;
  options: string[];
}

interface PollState extends PollData {
  votes: Record<string, number>; // identity -> optionIndex
  isActive: boolean;
}

interface PollWidgetProps {
  role: 'instructor' | 'student';
}

// ── Message Types ──
interface PollLaunchMessage {
  type: 'POLL_LAUNCH';
  pollId: string;
  question: string;
  options: string[];
}

interface PollVoteMessage {
  type: 'POLL_VOTE';
  pollId: string;
  optionIndex: number;
  identity: string;
}

interface PollEndMessage {
  type: 'POLL_END';
  pollId: string;
}

type PollMessage = PollLaunchMessage | PollVoteMessage | PollEndMessage;

export default function PollWidget({ role }: PollWidgetProps) {
  const room = useRoomContext();
  const [activePoll, setActivePoll] = useState<PollState | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [myVote, setMyVote] = useState<number | null>(null);
  const localIdentityRef = useRef<string>('');

  // Instructor-only form state
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);

  useEffect(() => {
    localIdentityRef.current = room.localParticipant.identity;
  }, [room]);

  // ── Broadcast helper ──
  const broadcast = useCallback(
    (message: PollMessage) => {
      const data = new TextEncoder().encode(JSON.stringify(message));
      room.localParticipant.publishData(data, {
        reliable: true,
        topic: POLL_TOPIC,
      });
    },
    [room]
  );

  // ── Handle incoming poll messages ──
  useEffect(() => {
    const handleDataReceived = (
      payload: Uint8Array,
      _participant?: { identity: string } | undefined,
      _kind?: unknown,
      topic?: string
    ) => {
      if (topic !== POLL_TOPIC) return;

      try {
        const text = new TextDecoder().decode(payload);
        const message: PollMessage = JSON.parse(text);

        switch (message.type) {
          case 'POLL_LAUNCH':
            setActivePoll({
              pollId: message.pollId,
              question: message.question,
              options: message.options,
              votes: {},
              isActive: true,
            });
            setHasVoted(false);
            setMyVote(null);
            break;

          case 'POLL_VOTE':
            setActivePoll((prev) => {
              if (!prev || prev.pollId !== message.pollId) return prev;
              return {
                ...prev,
                votes: {
                  ...prev.votes,
                  [message.identity]: message.optionIndex,
                },
              };
            });
            break;

          case 'POLL_END':
            setActivePoll((prev) => {
              if (!prev || prev.pollId !== message.pollId) return prev;
              return { ...prev, isActive: false };
            });
            break;
        }
      } catch (err) {
        console.error('Failed to process poll message:', err);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  // ── Instructor: Launch poll ──
  const launchPoll = useCallback(() => {
    const filledOptions = options.filter((o) => o.trim().length > 0);
    if (!question.trim() || filledOptions.length < 2) return;

    const pollId = `poll-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const msg: PollLaunchMessage = {
      type: 'POLL_LAUNCH',
      pollId,
      question: question.trim(),
      options: filledOptions,
    };

    // Set local state first
    setActivePoll({
      pollId,
      question: question.trim(),
      options: filledOptions,
      votes: {},
      isActive: true,
    });
    setHasVoted(false);
    setMyVote(null);

    // Broadcast
    broadcast(msg);

    // Clear form
    setQuestion('');
    setOptions(['', '', '', '']);
  }, [question, options, broadcast]);

  // ── Instructor: End poll ──
  const endPoll = useCallback(() => {
    if (!activePoll) return;

    broadcast({ type: 'POLL_END', pollId: activePoll.pollId });
    setActivePoll((prev) => (prev ? { ...prev, isActive: false } : null));
  }, [activePoll, broadcast]);

  // ── Student: Cast vote ──
  const castVote = useCallback(
    (optionIndex: number) => {
      if (!activePoll || hasVoted) return;

      const msg: PollVoteMessage = {
        type: 'POLL_VOTE',
        pollId: activePoll.pollId,
        optionIndex,
        identity: localIdentityRef.current,
      };

      // Update local state
      setActivePoll((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          votes: {
            ...prev.votes,
            [localIdentityRef.current]: optionIndex,
          },
        };
      });
      setHasVoted(true);
      setMyVote(optionIndex);

      broadcast(msg);
    },
    [activePoll, hasVoted, broadcast]
  );

  // ── Compute vote tallies ──
  const voteTallies = activePoll
    ? activePoll.options.map((_, idx) =>
        Object.values(activePoll.votes).filter((v) => v === idx).length
      )
    : [];
  const totalVotes = voteTallies.reduce((s, v) => s + v, 0);

  // ── Instructor: Update option field ──
  const updateOption = (index: number, value: string) => {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions((prev) => [...prev, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto">
      {/* ── Active Poll Display ── */}
      {activePoll && (
        <div className="fade-in mb-4">
          {/* Poll header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3
                  className="w-4 h-4 shrink-0"
                  style={{ color: 'var(--accent)' }}
                />
                <span
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{
                    color: activePoll.isActive
                      ? 'var(--accent-secondary)'
                      : 'var(--text-muted)',
                  }}
                >
                  {activePoll.isActive ? '● Live Poll' : '○ Poll Ended'}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white">
                {activePoll.question}
              </h3>
            </div>
            {role === 'instructor' && activePoll.isActive && (
              <button onClick={endPoll} className="btn-danger text-xs shrink-0">
                <XCircle className="w-3.5 h-3.5 inline mr-1" />
                End
              </button>
            )}
          </div>

          {/* Vote options (student, hasn't voted yet) */}
          {role === 'student' && activePoll.isActive && !hasVoted && (
            <div className="space-y-2 mb-4">
              {activePoll.options.map((opt, idx) => (
                <button
                  key={idx}
                  className="vote-option w-full text-left"
                  onClick={() => castVote(idx)}
                >
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold mr-3"
                    style={{
                      background: 'rgba(124, 92, 252, 0.15)',
                      color: 'var(--accent)',
                    }}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* Voted confirmation (student) */}
          {role === 'student' && hasVoted && (
            <div
              className="flex items-center gap-2 text-sm p-3 rounded-lg mb-4 fade-in"
              style={{
                background: 'rgba(92, 252, 140, 0.08)',
                border: '1px solid rgba(92, 252, 140, 0.15)',
                color: 'var(--success)',
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Vote submitted — Option{' '}
              {myVote !== null ? String.fromCharCode(65 + myVote) : ''}
            </div>
          )}

          {/* Results bar chart (visible to all when voted or instructor) */}
          {(role === 'instructor' || hasVoted || !activePoll.isActive) && (
            <div className="space-y-2.5">
              {activePoll.options.map((opt, idx) => {
                const count = voteTallies[idx];
                const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;

                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span style={{ color: 'var(--text-secondary)' }}>
                        <span
                          className="font-bold mr-1.5"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        {opt}
                      </span>
                      <span
                        className="font-mono text-xs tabular-nums"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {count} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="poll-bar-track">
                      <div
                        className={`poll-bar-fill bar-${idx % 4}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div
                className="text-xs text-right mt-1"
                style={{ color: 'var(--text-muted)' }}
              >
                {totalVotes} total vote{totalVotes !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Divider between active poll and create form ── */}
      {activePoll && role === 'instructor' && (
        <div
          className="border-t my-4"
          style={{ borderColor: 'var(--border-glass)' }}
        />
      )}

      {/* ── Instructor: Poll Creation Form ── */}
      {role === 'instructor' && (
        <div className="fade-in">
          <h4
            className="text-xs font-medium uppercase tracking-wider mb-3"
            style={{ color: 'var(--text-muted)' }}
          >
            Create New Poll
          </h4>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Type your question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="input-field text-sm"
            />

            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold shrink-0"
                  style={{
                    background: 'rgba(124, 92, 252, 0.12)',
                    color: 'var(--accent)',
                  }}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <input
                  type="text"
                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  value={opt}
                  onChange={(e) => updateOption(idx, e.target.value)}
                  className="input-field text-sm flex-1"
                />
                {options.length > 2 && (
                  <button
                    onClick={() => removeOption(idx)}
                    className="p-1.5 rounded-md transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--danger)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            {options.length < 6 && (
              <button
                onClick={addOption}
                className="flex items-center gap-1.5 text-xs transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add option
              </button>
            )}

            <button
              onClick={launchPoll}
              disabled={
                !question.trim() ||
                options.filter((o) => o.trim()).length < 2
              }
              className="btn-primary flex items-center justify-center gap-2 !text-sm !py-3 mt-2"
            >
              <Send className="w-4 h-4" />
              Launch Poll
            </button>
          </div>
        </div>
      )}

      {/* ── Student: Waiting State ── */}
      {role === 'student' && !activePoll && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(124, 92, 252, 0.1)' }}
          >
            <BarChart3 className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          </div>
          <p className="text-sm font-medium text-white mb-1">No active poll</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Polls launched by the instructor will appear here
          </p>
        </div>
      )}
    </div>
  );
}
