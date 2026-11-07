/**
 * @fileoverview Dashboard Page - Polished overview dashboard with gradient backgrounds
 * @module devpulse-ui/pages/Dashboard
 *
 * Vibrant dashboard with framer-motion animations, neon aesthetics, and custom fonts.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Zap,
  Clock,
  Code2,
  Database,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  TrendingUp,
  Settings
} from 'lucide-react';
import { getDevPulseRPC } from '../bridge/devpulse.rpc.svc';
import { parseFileCounts, type FileCounts } from '../lib/codebaseScanner.utl';
import { useStatusStore } from '../stores/status.store';
import { GlossaryTooltip } from '../components/GlossaryTooltip.ui';

interface SystemStats {
  health: 'healthy' | 'degraded' | 'unhealthy';
  uptime: string;
  version: string;
  engineStatus: string;
  websocketConnected: boolean;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  }
};

export function Dashboard(): React.JSX.Element {
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [factoryStats, setFactoryStats] = useState<FileCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const status = useStatusStore((state) => state.status);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const rpc = getDevPulseRPC();

        // Load System Stats
        const engineStatus = status?.lanes?.engine?.status === 'running' ? 'healthy' : 'degraded';
        const websocketConnected = status?.lanes?.engine?.status === 'running';

        setSystemStats({
          health: engineStatus,
          uptime: 'Calculating...', // TODO: Calculate actual uptime
          version: 'v0.1.0',
          engineStatus: status?.lanes?.engine?.status || 'unknown',
          websocketConnected,
        });

        // Load Factory Stats
        const kindtypes = await rpc.scanKindtypes();
        const counts = parseFileCounts(kindtypes);
        setFactoryStats(counts);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
        setSystemStats({
          health: 'unhealthy',
          uptime: 'N/A',
          version: 'v0.1.0',
          engineStatus: 'disconnected',
          websocketConnected: false,
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [status]);

  if (loading) {
    return (
      <div className="min-h-full w-full bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 text-center max-w-md"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-6"
          >
            <Sparkles className="w-16 h-16 text-neon-blue" />
          </motion.div>
          <div className="animate-glow text-neon-blue text-3xl font-bold font-orbitron mb-4">
            Loading Dashboard...
          </div>
          <div className="text-neon-pink animate-pulse font-rajdhani text-lg">
            Initializing systems...
          </div>
        </motion.div>
      </div>
    );
  }

  const healthConfig = {
    healthy: {
      icon: CheckCircle2,
      color: 'text-neon-green',
      borderColor: 'border-neon-green',
      glowColor: 'shadow-neon-green'
    },
    degraded: {
      icon: AlertTriangle,
      color: 'text-neon-yellow',
      borderColor: 'border-neon-yellow',
      glowColor: 'shadow-neon-yellow'
    },
    unhealthy: {
      icon: XCircle,
      color: 'text-neon-pink',
      borderColor: 'border-neon-pink',
      glowColor: 'shadow-neon-pink'
    }
  };

  const currentHealth = systemStats?.health || 'unhealthy';
  const HealthIcon = healthConfig[currentHealth].icon;

  return (
    <div className="min-h-full w-full bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-12"
        >
          <h1 className="text-5xl font-extrabold font-orbitron bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent mb-3 animate-glow">
            DevPulse Dashboard
          </h1>
          <p className="text-gray-300 font-rajdhani text-xl">
            Real-time system monitoring, health metrics, and codebase intelligence
          </p>
        </motion.div>

        {/* System Health Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {/* Health Status */}
          <motion.div variants={itemVariants} className="glass-card p-6 hover-scale neon-border group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-rajdhani font-semibold uppercase tracking-wider">
                System Health
              </span>
              <HealthIcon className={`w-6 h-6 ${healthConfig[currentHealth].color}`} />
            </div>
            <div className={`text-4xl font-bold ${healthConfig[currentHealth].color} animate-glow font-orbitron mb-2`}>
              {currentHealth}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className={`w-2 h-2 rounded-full ${healthConfig[currentHealth].color} animate-pulse`} />
              <span className="text-xs text-gray-400 font-rajdhani">
                Engine Status: {systemStats?.engineStatus}
              </span>
            </div>
          </motion.div>

          {/* WebSocket Status */}
          <motion.div variants={itemVariants} className="glass-card p-6 hover-scale hover-glow group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-rajdhani font-semibold uppercase tracking-wider">
                <GlossaryTooltip term="websocket">WebSocket</GlossaryTooltip>
              </span>
              <Zap className={`w-6 h-6 ${systemStats?.websocketConnected ? 'text-neon-green' : 'text-neon-pink'}`} />
            </div>
            <div className={`text-3xl font-bold ${systemStats?.websocketConnected ? 'text-neon-green' : 'text-neon-pink'} font-orbitron mb-2`}>
              {systemStats?.websocketConnected ? 'Connected' : 'Disconnected'}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Activity className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-400 font-rajdhani">
                Real-time bridge active
              </span>
            </div>
          </motion.div>

          {/* Uptime */}
          <motion.div variants={itemVariants} className="glass-card p-6 hover-scale hover-glow group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-rajdhani font-semibold uppercase tracking-wider">
                Uptime
              </span>
              <Clock className="w-6 h-6 text-neon-teal" />
            </div>
            <div className="text-3xl font-bold text-neon-teal font-orbitron mb-2">
              {systemStats?.uptime}
            </div>
            <div className="text-xs text-gray-400 font-rajdhani mt-3">
              Continuous monitoring
            </div>
          </motion.div>

          {/* Version */}
          <motion.div variants={itemVariants} className="glass-card p-6 hover-scale hover-glow group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-rajdhani font-semibold uppercase tracking-wider">
                Version
              </span>
              <Code2 className="w-6 h-6 text-neon-violet" />
            </div>
            <div className="text-3xl font-bold text-neon-violet font-orbitron mb-2">
              {systemStats?.version}
            </div>
            <div className="text-xs text-gray-400 font-rajdhani mt-3">
              Latest stable release
            </div>
          </motion.div>
        </motion.div>

        {/* Factory Stats */}
        {factoryStats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-8 h-8 text-neon-pink" />
              <h2 className="text-3xl font-bold text-neon-pink font-orbitron">
                <GlossaryTooltip term="factory">Factory</GlossaryTooltip> Statistics
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Contracts */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-card p-8 hover-scale neon-border group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400 text-sm font-rajdhani font-semibold uppercase tracking-wider">
                    <GlossaryTooltip term="contract">Contracts</GlossaryTooltip>
                  </span>
                  <FileCode className="w-6 h-6 text-neon-blue" />
                </div>
                <div className="text-5xl font-bold text-neon-blue animate-float font-orbitron mb-3">
                  {factoryStats.contract}
                </div>
                <div className="text-sm text-gray-400 font-rajdhani">
                  Schema definitions
                </div>
              </motion.div>

              {/* Services */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="glass-card p-8 hover-scale neon-border group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400 text-sm font-rajdhani font-semibold uppercase tracking-wider">
                    Services
                  </span>
                  <Database className="w-6 h-6 text-neon-pink" />
                </div>
                <div className="text-5xl font-bold text-neon-pink animate-float font-orbitron mb-3" style={{ animationDelay: '0.5s' }}>
                  {factoryStats.svc}
                </div>
                <div className="text-sm text-gray-400 font-rajdhani">
                  Service modules
                </div>
              </motion.div>

              {/* Checks */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="glass-card p-8 hover-scale neon-border group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400 text-sm font-rajdhani font-semibold uppercase tracking-wider">
                    <GlossaryTooltip term="check">Checks</GlossaryTooltip>
                  </span>
                  <CheckCircle2 className="w-6 h-6 text-neon-teal" />
                </div>
                <div className="text-5xl font-bold text-neon-teal animate-float font-orbitron mb-3" style={{ animationDelay: '1s' }}>
                  {factoryStats.check}
                </div>
                <div className="text-sm text-gray-400 font-rajdhani">
                  Quality validators
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-8 h-8 text-neon-teal" />
            <h2 className="text-3xl font-bold text-neon-teal font-orbitron">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.button
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="glass-card p-8 hover-glow text-left group border border-transparent hover:border-neon-blue transition-all"
            >
              <TrendingUp className="w-10 h-10 text-neon-blue mb-4 group-hover:animate-pulse" />
              <div className="font-bold text-xl text-neon-blue group-hover:text-white transition-colors font-orbitron mb-2">
                View Reports
              </div>
              <div className="text-sm text-gray-400 font-rajdhani">
                Check latest validation reports and analytics
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="glass-card p-8 hover-glow text-left group border border-transparent hover:border-neon-pink transition-all"
            >
              <Database className="w-10 h-10 text-neon-pink mb-4 group-hover:animate-pulse" />
              <div className="font-bold text-xl text-neon-pink group-hover:text-white transition-colors font-orbitron mb-2">
                Explore Factory
              </div>
              <div className="text-sm text-gray-400 font-rajdhani">
                Browse contracts, types, and schema definitions
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="glass-card p-8 hover-glow text-left group border border-transparent hover:border-neon-violet transition-all"
            >
              <Settings className="w-10 h-10 text-neon-teal mb-4 group-hover:animate-pulse" />
              <div className="font-bold text-xl text-neon-teal group-hover:text-white transition-colors font-orbitron mb-2">
                Configure Engine
              </div>
              <div className="text-sm text-gray-400 font-rajdhani">
                Manage DevPulse settings and integrations
              </div>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
