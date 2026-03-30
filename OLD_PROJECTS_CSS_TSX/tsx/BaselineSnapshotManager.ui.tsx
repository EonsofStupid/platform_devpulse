// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/admin/features/DataClyffy/DataManage/components/BaselineSnapshotManager.ui.tsx
import { Clock, Database, Plus, Shield } from 'lucide-react';
import React, { useEffect } from 'react';
import { useBaselineStore } from '@/admin/features/DataClyffy/stores/Baseline/Baseline.store';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BaselineDetailsModal } from './BaselineDetailsModal';
import { BaselineRestoreDialog } from './BaselineRestoreDialog';
import { BaselineSnapshotCard } from './BaselineSnapshotCard';
import { CreateBaselineDialog } from './CreateBaselineDialog';

export const BaselineSnapshotManager: React.FC = () => {
  const {
    snapshots,
    loading,
    error,
    selectedSnapshot,
    loadSnapshots,
    createSnapshot,
    restoreSnapshot,
    deleteSnapshot,
    setSelectedSnapshot,
    clearError,
  } = useBaselineStore();

  const [showDetailsModal, setShowDetailsModal] = React.useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = React.useState(false);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSnapshots();
  }, [loadSnapshots]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
      clearError();
    }
  }, [error, toast, clearError]);

  const handleCreateSnapshot = async (itemType: string, description: string) => {
    const success = await createSnapshot(itemType, description);
    if (success) {
      toast({
        title: 'Success',
        description: 'Baseline snapshot created successfully',
      });
      setShowCreateDialog(false);
    }
  };

  const handleRestoreSnapshot = async () => {
    if (!selectedSnapshot) return;

    const success = await restoreSnapshot(selectedSnapshot.id);
    if (success) {
      toast({
        title: 'Success',
        description: 'Baseline snapshot restored successfully',
      });
      setShowRestoreDialog(false);
      setSelectedSnapshot(null);
    }
  };

  const handleDeleteSnapshot = async (snapshotId: string) => {
    const success = await deleteSnapshot(snapshotId);
    if (success) {
      toast({
        title: 'Success',
        description: 'Baseline snapshot deleted successfully',
      });
    }
  };

  const activeSnapshots = snapshots.filter((s) => s.isActive);
  const inactiveSnapshots = snapshots.filter((s) => !s.isActive);

  if (loading && snapshots.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan mx-auto"></div>
        <p className="text-muted-foreground mt-4">Loading baseline snapshots...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-orbitron font-bold neon-text-cyan">
            Baseline Snapshot Manager
          </h1>
          <p className="text-gray-400 mt-2">Enterprise-grade data protection and recovery system</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-neon-cyan text-black hover:bg-neon-cyan/90"
          disabled={loading}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Baseline
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-neon-cyan/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Snapshots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neon-cyan">{snapshots.length}</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-green-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Snapshots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{activeSnapshots.length}</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-gray-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Archived Snapshots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">{inactiveSnapshots.length}</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-blue-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {snapshots.reduce((sum, s) => sum + s.recordCount, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Snapshots */}
      {activeSnapshots.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-neon-cyan flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Active Baseline Snapshots
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSnapshots.map((snapshot) => (
              <BaselineSnapshotCard
                key={snapshot.id}
                snapshot={snapshot}
                onView={() => {
                  setSelectedSnapshot(snapshot);
                  setShowDetailsModal(true);
                }}
                onRestore={() => {
                  setSelectedSnapshot(snapshot);
                  setShowRestoreDialog(true);
                }}
                onDelete={() => handleDeleteSnapshot(snapshot.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive/Archived Snapshots */}
      {inactiveSnapshots.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-400 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Archived Snapshots
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactiveSnapshots.map((snapshot) => (
              <BaselineSnapshotCard
                key={snapshot.id}
                snapshot={snapshot}
                onView={() => {
                  setSelectedSnapshot(snapshot);
                  setShowDetailsModal(true);
                }}
                onRestore={() => {
                  setSelectedSnapshot(snapshot);
                  setShowRestoreDialog(true);
                }}
                onDelete={() => handleDeleteSnapshot(snapshot.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {snapshots.length === 0 && !loading && (
        <Card className="glass-card border-neon-cyan/30">
          <CardContent className="text-center py-12">
            <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No Baseline Snapshots</h3>
            <p className="text-gray-400 mb-4">
              Create your first baseline snapshot to protect your data
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-neon-cyan text-black hover:bg-neon-cyan/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Baseline
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {selectedSnapshot && (
        <>
          <BaselineDetailsModal
            snapshot={selectedSnapshot}
            open={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedSnapshot(null);
            }}
          />
          <BaselineRestoreDialog
            snapshot={selectedSnapshot}
            open={showRestoreDialog}
            onConfirm={handleRestoreSnapshot}
            onClose={() => {
              setShowRestoreDialog(false);
              setSelectedSnapshot(null);
            }}
          />
        </>
      )}

      <CreateBaselineDialog
        open={showCreateDialog}
        onConfirm={handleCreateSnapshot}
        onClose={() => setShowCreateDialog(false)}
      />
    </div>
  );
};
