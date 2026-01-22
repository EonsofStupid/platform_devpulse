/**
 * @fileoverview Kindtypes Tab - File Kindtype Analysis
 * @module devpulse-ui/panels/tabs/KindtypesTab
 * 
 * Groups results by domain/feature/kind, shows counts and violations, provides file navigation.
 */

import React, { useEffect, useState } from "react";
import { getDevPulseRPC } from "../../bridge/devpulse.rpc.svc";

interface ScanKindtypesResult {
  totals: Record<string, number>;
  kinds: Array<{ id: string; label: string; suffix: string }>;
  violations: Array<{ file: string; kind: string; message: string }>;
}

export function KindtypesTab() {
  const [data, setData] = useState<ScanKindtypesResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [selectedFeature, setSelectedFeature] = useState<string>("");
  const [selectedKind, setSelectedKind] = useState<string>("");
  const [violationsOnly, setViolationsOnly] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        console.log('[DevPulse] KindtypesTab: Loading kindtypes...');
        const result = await getDevPulseRPC().scanKindtypes();
        setData(result);
        console.log('[DevPulse] KindtypesTab: Kindtypes loaded:', result);
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        console.error('[DevPulse] KindtypesTab: Error loading kindtypes:', errorMsg);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Extract domain/feature from file paths
  const extractDomain = (file: string): string | undefined => {
    const match = file.match(/domains\/([^/]+)/);
    return match ? match[1] : undefined;
  };

  const extractFeature = (file: string): string | undefined => {
    const match = file.match(/features\/([^/]+)/);
    return match ? match[1] : undefined;
  };

  // Get unique domains, features, and kinds for filters
  const domains = React.useMemo(() => {
    if (!data) return [];
    const domainSet = new Set<string>();
    for (const violation of data.violations) {
      const domain = extractDomain(violation.file);
      if (domain) domainSet.add(domain);
    }
    return Array.from(domainSet).sort();
  }, [data]);

  const features = React.useMemo(() => {
    if (!data) return [];
    const featureSet = new Set<string>();
    for (const violation of data.violations) {
      const feature = extractFeature(violation.file);
      if (feature) featureSet.add(feature);
    }
    return Array.from(featureSet).sort();
  }, [data]);

  const kinds = React.useMemo(() => {
    if (!data) return [];
    return data.kinds.map(k => k.id).sort();
  }, [data]);

  // Group results by Domain → Feature → Kind
  const groupedResults = React.useMemo(() => {
    if (!data) return [];

    // Create nested structure: domain -> feature -> kind -> items
    const domainMap = new Map<string, Map<string, Map<string, {
      count: number;
      violations: Array<{ file: string; kind: string; message: string }>;
    }>>>();

    // Group violations by domain/feature/kind
    for (const violation of data.violations) {
      const domain = extractDomain(violation.file) || 'unknown';
      const feature = extractFeature(violation.file) || 'unknown';
      const kind = violation.kind;

      if (!domainMap.has(domain)) {
        domainMap.set(domain, new Map());
      }
      const featureMap = domainMap.get(domain)!;
      
      if (!featureMap.has(feature)) {
        featureMap.set(feature, new Map());
      }
      const kindMap = featureMap.get(feature)!;
      
      if (!kindMap.has(kind)) {
        kindMap.set(kind, {
          count: data.totals[kind] || 0,
          violations: [],
        });
      }
      
      kindMap.get(kind)!.violations.push(violation);
    }

    // Flatten to array structure
    const result: Array<{
      domain: string;
      feature: string;
      kind: string;
      count: number;
      violations: Array<{ file: string; kind: string; message: string }>;
    }> = [];

    for (const [domain, featureMap] of domainMap.entries()) {
      for (const [feature, kindMap] of featureMap.entries()) {
        for (const [kind, data] of kindMap.entries()) {
          result.push({
            domain,
            feature,
            kind,
            count: data.count,
            violations: data.violations,
          });
        }
      }
    }

    // Apply filters
    return result.filter((item) => {
      if (violationsOnly && item.violations.length === 0) return false;
      if (selectedDomain && item.domain !== selectedDomain) return false;
      if (selectedFeature && item.feature !== selectedFeature) return false;
      if (selectedKind && item.kind !== selectedKind) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          item.kind.toLowerCase().includes(search) ||
          item.domain.toLowerCase().includes(search) ||
          item.feature.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [data, selectedDomain, selectedFeature, selectedKind, violationsOnly, searchTerm]);

  if (loading) {
    return <div className="dp-section"><h3>Kindtypes</h3><p>Loading...</p></div>;
  }

  if (error) {
    return <div className="dp-section"><h3>Kindtypes</h3><p className="dp-error-message">Error: {error}</p></div>;
  }

  if (!data) {
    return <div className="dp-section"><h3>Kindtypes</h3><p>No data available</p></div>;
  }

  return (
    <div className="dp-section">
      <h3>Kindtypes</h3>
      
      {/* Filters */}
      <div className="dp-kindtypes-filters">
        <div className="dp-kindtypes-filter-row">
          <input
            type="text"
            placeholder="Search by domain, feature, or kind..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="dp-kindtypes-search-input"
          />
          <label className="dp-kindtypes-filter-toggle">
            <input
              type="checkbox"
              checked={violationsOnly}
              onChange={(e) => setViolationsOnly(e.target.checked)}
            />
            <span>Violations only</span>
          </label>
        </div>
        <div className="dp-kindtypes-filter-row">
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="dp-kindtypes-filter-select"
          >
            <option value="">All Domains</option>
            {domains.map((domain) => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ))}
          </select>
          <select
            value={selectedFeature}
            onChange={(e) => setSelectedFeature(e.target.value)}
            className="dp-kindtypes-filter-select"
          >
            <option value="">All Features</option>
            {features.map((feature) => (
              <option key={feature} value={feature}>
                {feature}
              </option>
            ))}
          </select>
          <select
            value={selectedKind}
            onChange={(e) => setSelectedKind(e.target.value)}
            className="dp-kindtypes-filter-select"
          >
            <option value="">All Kinds</option>
            {kinds.map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="dp-kindtypes-summary">
        <p>
          <strong>Total kinds:</strong> {data.kinds.length} |{" "}
          <strong>Total violations:</strong> {data.violations.length}
        </p>
      </div>

      {/* Grouped Results */}
      <div className="dp-kindtypes-results">
        {groupedResults.map((group, idx) => (
          <div key={`${group.domain}-${group.feature}-${group.kind}-${idx}`} className="dp-kindtypes-group">
            <h4>
              <span className="dp-kindtypes-domain">{group.domain}</span>
              {' → '}
              <span className="dp-kindtypes-feature">{group.feature}</span>
              {' → '}
              <span className="dp-kindtypes-kind">{group.kind}</span>
            </h4>
            <p>
              <strong>Count:</strong> {group.count}
              {group.violations.length > 0 && (
                <span className="dp-kindtypes-violations-count">
                  {' | '}
                  <strong>Violations:</strong> {group.violations.length}
                </span>
              )}
            </p>
            
            {group.violations.length > 0 && (
              <div className="dp-kindtypes-violations">
                <strong>Violations:</strong>
                <ul>
                  {group.violations.map((v, vidx) => (
                    <li key={vidx}>
                      <a
                        href={`#file:${v.file}`}
                        onClick={(e) => {
                          e.preventDefault();
                          // Emit navigation event
                          window.dispatchEvent(new CustomEvent('devpulse:file:navigate', { 
                            detail: { file: v.file } 
                          }));
                        }}
                        className="dp-kindtypes-file-link"
                      >
                        {v.file}
                      </a>
                      : {v.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

