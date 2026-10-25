// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/web/features/DataExplorer/ContentDisplay/ContentDisplaySection.ui.tsx
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Brain,
  Database,
  Eye,
  Filter,
  Grid3x3,
  Layers,
  List,
  Network,
  Search,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useMi3dpDataExplorer } from '@/domains/web/features/DataExplorer/hooks';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { DataExplorerCard } from '../components/DataExplorerCard/DataExplorerCard.ui';

export const ContentDisplaySection: React.FC = () => {
  const dataExplorerState = useMi3dpDataExplorer();
  const { state, itemTypes, actions } = dataExplorerState;

  const [activeVisualization, setActiveVisualization] = useState('intelligent-grid');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [relationshipDepth, setRelationshipDepth] = useState(2);
  const [insightMode, setInsightMode] = useState('patterns');

  // Dynamic analysis of current data structure
  const dataAnalysis = useMemo(() => {
    const items = Object.values(state.items).flat();
    const relationships = items.flatMap((item) => item.relationships || []);

    return {
      totalItems: items.length,
      totalConnections: relationships.length,
      categoryDistribution: itemTypes
        .map((type) => ({
          ...type,
          count: items.filter((item) => item.item_type_slug === type.slug).length,
          connectivity: relationships.filter(
            (rel) => items.find((item) => item.id === rel.sourceId)?.item_type_slug === type.slug,
          ).length,
        }))
        .sort((a, b) => b.connectivity - a.connectivity),
      complexityScore: Math.min(100, (relationships.length / Math.max(items.length, 1)) * 20),
      dominantPatterns: analyzeDominantPatterns(items, relationships),
    };
  }, [state.items, itemTypes]);

  // Intelligent visualization recommendations
  const visualizationRecommendations = useMemo(() => {
    const { complexityScore, totalConnections, totalItems } = dataAnalysis;

    if (complexityScore > 60) {
      return {
        primary: 'network-graph',
        secondary: 'hierarchical-clusters',
        reason: 'High relationship complexity detected',
      };
    } else if (totalItems > 50) {
      return {
        primary: 'intelligent-grid',
        secondary: 'category-timeline',
        reason: 'Large dataset requires organized view',
      };
    } else {
      return {
        primary: 'enhanced-cards',
        secondary: 'relationship-flow',
        reason: 'Moderate dataset perfect for detailed exploration',
      };
    }
  }, [dataAnalysis]);

  const handleVisualizationChange = (mode: string) => {
    setActiveVisualization(mode);
    // Analytics tracking for user preferences
    actions.trackInteraction?.('visualization_change', {
      mode,
      context: dataAnalysis,
    });
  };

  const handleItemSelect = (itemId: string) => {
    setSelectedItem(itemId);
    actions.loadRelationships?.(itemId, relationshipDepth);
  };

  return (
    <div>
      {/* Intelligent Header */}
      <motion.div
        className="mi-data__table-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header-title-section">
          <div className="title-group">
            <Brain className="w-6 h-6 text-purple-400" />
            <h2 className="mi-text-purple mi-fx-text-glow">Intelligent Data Visualization</h2>
            <Badge variant="secondary" className="ai-badge">
              <Sparkles className="w-3 h-3" />
              AI-Powered
            </Badge>
          </div>
          <p className="header-description">
            Dynamic visualization adapting to your data patterns and relationships
          </p>
        </div>

        {/* Data Intelligence Summary */}
        <div className="intelligence-summary">
          <div className="intelligence-metrics">
            <div className="metric-item">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>{dataAnalysis.totalItems.toLocaleString()} Items</span>
            </div>
            <div className="metric-item">
              <Network className="w-4 h-4 text-green-400" />
              <span>{dataAnalysis.totalConnections.toLocaleString()} Connections</span>
            </div>
            <div className="metric-item">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span>{Math.round(dataAnalysis.complexityScore)}% Complexity</span>
            </div>
            <div className="metric-item">
              <Eye className="w-4 h-4 text-yellow-400" />
              <span>{dataAnalysis.categoryDistribution.length} Categories</span>
            </div>
          </div>

          {/* AI Recommendation */}
          <motion.div
            className="ai-recommendation"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="recommendation-text">
              Recommended: {visualizationRecommendations.primary.replace('-', ' ')}
            </span>
            <span className="recommendation-reason">{visualizationRecommendations.reason}</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Visualization Mode Selector */}
      <motion.div
        className="visualization-controls"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeVisualization} onValueChange={handleVisualizationChange}>
          <TabsList className="visualization-tabs">
            <TabsTrigger value="intelligent-grid" className="tab-trigger">
              <Grid3x3 className="w-4 h-4" />
              Smart Grid
              {visualizationRecommendations.primary === 'intelligent-grid' && (
                <Badge className="ml-2 bg-yellow-500/20 text-yellow-400 text-xs">AI</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="network-graph" className="tab-trigger">
              <Network className="w-4 h-4" />
              Network View
              {visualizationRecommendations.primary === 'network-graph' && (
                <Badge className="ml-2 bg-yellow-500/20 text-yellow-400 text-xs">AI</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="enhanced-cards" className="tab-trigger">
              <Layers className="w-4 h-4" />
              Rich Cards
            </TabsTrigger>
            <TabsTrigger value="relationship-flow" className="tab-trigger">
              <ArrowRight className="w-4 h-4" />
              Flow View
            </TabsTrigger>
            <TabsTrigger value="data-insights" className="tab-trigger">
              <TrendingUp className="w-4 h-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Dynamic Content Based on Visualization Mode */}
          <AnimatePresence mode="wait">
            <TabsContent value="intelligent-grid" className="visualization-content">
              <div className="mi-data__grid">
                {/* Intelligent Grid - All items in a smart layout */}
                <div className="intelligent-grid">
                  {Object.values(state.items)
                    .flat()
                    .map((item) => (
                      <DataExplorerCard
                        key={item.id}
                        item={item}
                        onClick={(item) => handleItemSelect(item.id)}
                        showTooltip={true}
                        compact={true}
                      />
                    ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="network-graph" className="visualization-content">
              <div className="mi-data__card">
                <h3>Network Graph View</h3>
                <p>Network visualization will be implemented here</p>
              </div>
            </TabsContent>

            <TabsContent value="enhanced-cards" className="visualization-content">
              <div className="mi-data__grid">
                {Object.entries(state.items).map(([typeSlug, items]) => (
                  <div key={typeSlug} className="type-section">
                    <div className="type-header">
                      <h3 className="type-title">
                        {itemTypes.find((t) => t.slug === typeSlug)?.name || typeSlug}
                      </h3>
                      <Badge variant="secondary" className="type-count">
                        {items.length} items
                      </Badge>
                    </div>
                    <div className="items-grid">
                      {items.map((item) => (
                        <DataExplorerCard
                          key={item.id}
                          item={item}
                          onClick={(item) => handleItemSelect(item.id)}
                          showTooltip={true}
                          compact={false}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="relationship-flow" className="visualization-content">
              <div className="mi-data__card">
                <h3>Relationship Flow View</h3>
                <p>Relationship flow visualization will be implemented here</p>
              </div>
            </TabsContent>

            <TabsContent value="data-insights" className="visualization-content">
              <div className="mi-data__card">
                <h3>Data Insights</h3>
                <p>Data insights visualization will be implemented here</p>
              </div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </motion.div>

      {/* Export and Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="mi-data__card">
          <h3>Export Tools</h3>
          <p>Export functionality will be implemented here</p>
        </div>
      </motion.div>
    </div>
  );
};

// Helper function to analyze patterns
function analyzeDominantPatterns(items: any[], relationships: any[]) {
  const patterns = {
    hierarchical: calculateHierarchicalScore(relationships),
    networked: calculateNetworkScore(relationships),
    clustered: calculateClusterScore(items, relationships),
    sequential: calculateSequentialScore(relationships),
  };

  return Object.entries(patterns)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([pattern, score]) => ({ pattern, score: Math.round(score * 100) }));
}

function calculateHierarchicalScore(relationships: any[]): number {
  // Implementation for detecting hierarchical patterns
  return Math.random() * 0.8; // Placeholder
}

function calculateNetworkScore(relationships: any[]): number {
  // Implementation for detecting network patterns
  return Math.random() * 0.8; // Placeholder
}

function calculateClusterScore(items: any[], relationships: any[]): number {
  // Implementation for detecting cluster patterns
  return Math.random() * 0.8; // Placeholder
}

function calculateSequentialScore(relationships: any[]): number {
  // Implementation for detecting sequential patterns
  return Math.random() * 0.8; // Placeholder
}
