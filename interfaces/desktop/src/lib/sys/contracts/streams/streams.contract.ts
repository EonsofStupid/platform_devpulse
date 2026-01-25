/**
 * @file sys/contracts/streams/streams.contract.ts
 * @module @devpulse/sys/contracts/streams
 * @description Stream/subscription contracts for async data flows
 */

import type { Registry } from '../core/registry.contract.js';

/** Stream status */
export type StreamStatus = 'idle' | 'connecting' | 'active' | 'paused' | 'error' | 'closed';

/** Stream metadata for registry */
export interface StreamMetadata {
  /** Stream identifier */
  id: string;
  /** Stream type e.g. 'websocket', 'sse', 'polling' */
  type: string;
  /** Source URL or identifier */
  source: string;
  /** Current status */
  status: StreamStatus;
  /** When stream was created */
  createdAt: Date;
  /** Last message timestamp */
  lastMessageAt?: Date;
  /** Error message if status is 'error' */
  error?: string;
}

/** Stream message envelope */
export interface StreamMessage<T = unknown> {
  id: string;
  type: string;
  payload: T;
  timestamp: Date;
  source: string;
}

/** Stream subscription handle */
export interface StreamSubscription {
  /** Unsubscribe from stream */
  unsubscribe(): void;
  /** Pause receiving messages */
  pause(): void;
  /** Resume receiving messages */
  resume(): void;
  /** Check if subscription is active */
  isActive(): boolean;
}

/** Stream contract - what a stream module must implement */
export interface StreamContract<T = unknown> {
  /** Stream metadata */
  readonly metadata: StreamMetadata;
  /** Subscribe to stream messages */
  subscribe(callback: (message: StreamMessage<T>) => void): StreamSubscription;
  /** Connect/start the stream */
  connect(): Promise<void>;
  /** Disconnect/stop the stream */
  disconnect(): Promise<void>;
  /** Send a message (for bidirectional streams) */
  send?(message: T): Promise<void>;
}

/** Stream factory for creating new streams */
export type StreamFactory<T = unknown> = (config: {
  id: string;
  source: string;
  options?: Record<string, unknown>;
}) => StreamContract<T>;

/** Streams registry contract */
export interface StreamsRegistry extends Registry<StreamMetadata> {
  /** Get streams by type */
  getByType(type: string): StreamMetadata[];
  /** Get active streams */
  getActive(): StreamMetadata[];
}
