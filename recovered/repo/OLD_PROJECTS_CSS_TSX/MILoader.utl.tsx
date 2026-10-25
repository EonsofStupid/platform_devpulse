// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/common/utils/MIBoundary/MILoader.utl.tsx
import type React from 'react';
import { Component, type ReactNode } from 'react';
import styles from './styles/module.css/miboundary.module.css';
import type { MIBoundaryProps, MIBoundaryState } from './types/MIBoundary.types';

class MIBoundary extends Component<MIBoundaryProps, MIBoundaryState> {
  private retryCount = 0;
  private maxRetries = 3;
  private errorThreshold = 5;
  private errorWindow = 60000; // 1 minute
  private errorTimestamps: number[] = [];
  private circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private lastFailureTime = 0;
  private recoveryTimeout = 30000; // 30 seconds

  constructor(props: MIBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      isRecovering: false,
      circuitOpen: false,
      errorCount: 0,
      isFloating: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<MIBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `mi_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      errorInfo,
      isFloating: true,
    });

    // Circuit breaker logic
    this.recordError();
    this.evaluateCircuitState();

    console.error('[MIBoundary] Circuit breaker activated:', error, errorInfo);

    // Enhanced telemetry with multiple providers
    await this.reportToTelemetry(error, errorInfo);

    // Trigger floating animation
    setTimeout(() => {
      this.setState({ isFloating: false });
    }, 3000);
  }

  private recordError() {
    const now = Date.now();
    this.errorTimestamps.push(now);

    // Remove old timestamps outside the window
    this.errorTimestamps = this.errorTimestamps.filter(
      (timestamp) => now - timestamp < this.errorWindow,
    );

    this.setState({ errorCount: this.errorTimestamps.length });
  }

  private evaluateCircuitState() {
    const now = Date.now();

    switch (this.circuitState) {
      case 'CLOSED':
        if (this.errorTimestamps.length >= this.errorThreshold) {
          this.circuitState = 'OPEN';
          this.lastFailureTime = now;
          this.setState({ circuitOpen: true });
          console.warn('[MIBoundary] Circuit opened due to error threshold');
        }
        break;

      case 'OPEN':
        if (now - this.lastFailureTime > this.recoveryTimeout) {
          this.circuitState = 'HALF_OPEN';
          console.info('[MIBoundary] Circuit half-open, testing recovery');
        }
        break;

      case 'HALF_OPEN':
        // Will be handled in retry logic
        break;
    }
  }

  private async reportToTelemetry(error: Error, errorInfo: React.ErrorInfo) {
    const errorData = {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      circuitState: this.circuitState,
      errorCount: this.errorTimestamps.length,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    try {
      // Sentry integration
      const { sentryService } = await import('@/common/features/Telemetry/Sentry/Sentry.utl');
      await sentryService.captureException(error, {
        tags: {
          component: 'MIBoundary',
          circuitState: this.circuitState,
        },
        extra: errorData,
      });
    } catch (sentryError) {
      console.warn('[MIBoundary] Sentry reporting failed:', sentryError);
    }

    try {
      // PostHog integration
      const { posthogService } = await import('@/common/features/Telemetry/PostHog/PostHog.utl');
      await posthogService.capture('mi_boundary_error', errorData);
    } catch (posthogError) {
      console.warn('[MIBoundary] PostHog reporting failed:', posthogError);
    }

    try {
      // Telemetry service fallback
      const { telemetryService } = await import('@/common/features/Telemetry/Telemetry.svc');
      await telemetryService.captureError(error, {
        context: 'MIBoundary',
        componentStack: errorInfo.componentStack,
        circuitState: this.circuitState,
      });
    } catch (telemetryError) {
      console.warn('[MIBoundary] Telemetry service failed:', telemetryError);
    }
  }

  handleRetry = () => {
    if (this.circuitState === 'OPEN') {
      console.warn('[MIBoundary] Retry blocked - circuit is open');
      return;
    }

    if (this.retryCount < this.maxRetries) {
      this.retryCount++;

      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
        isRecovering: true,
        isFloating: true,
      });

      // Circuit breaker recovery logic
      if (this.circuitState === 'HALF_OPEN') {
        this.circuitState = 'CLOSED';
        this.errorTimestamps = [];
        this.setState({ circuitOpen: false, errorCount: 0 });
        console.info('[MIBoundary] Circuit closed - recovery successful');
      }

      // Reset states after animation
      setTimeout(() => {
        this.setState({
          isRecovering: false,
          isFloating: false,
        });
      }, 2000);
    }
  };

  handleRefresh = () => {
    // Reset circuit breaker on manual refresh
    this.circuitState = 'CLOSED';
    this.errorTimestamps = [];
    this.retryCount = 0;
    window.location.reload();
  };

  handleCopyError = async () => {
    if (this.state.error && this.state.errorInfo) {
      const errorText = `
MIBoundary Error Report
======================
Error ID: ${this.state.errorId}
Circuit State: ${this.circuitState}
Error Count: ${this.state.errorCount}
Timestamp: ${new Date().toISOString()}

Error: ${this.state.error.message}

Stack Trace:
${this.state.error.stack}

Component Stack:
${this.state.errorInfo.componentStack}

URL: ${window.location.href}
User Agent: ${navigator.userAgent}
      `.trim();

      try {
        await navigator.clipboard.writeText(errorText);
        console.log('[MIBoundary] Error details copied to clipboard');
      } catch (err) {
        console.error('[MIBoundary] Failed to copy error details:', err);
      }
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { fallbackComponent: FallbackComponent, showDetails = true } = this.props;
      const canRetry = this.retryCount < this.maxRetries && this.circuitState !== 'OPEN';

      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            retry={canRetry ? this.handleRetry : undefined}
            refresh={this.handleRefresh}
            circuitState={this.circuitState}
            errorCount={this.state.errorCount}
          />
        );
      }

      const containerClasses = [
        styles['mi-boundary'],
        this.state.isFloating && styles['floating'],
        this.state.isRecovering && styles['recovering'],
        this.state.circuitOpen && styles['circuit-open'],
      ]
        .filter(Boolean)
        .join(' ');

      return (
        <div className={containerClasses}>
          <div className={styles['mi-boundary-container']}>
            <div className={styles['impulse-logo']}>
              <div className={styles['logo-glow']}></div>
              <h1 className={styles['mi-boundary-title']}>IMPULSE SYSTEM PROTECTION</h1>
            </div>

            <div className={styles['circuit-status']}>
              <span className={styles[`circuit-${this.circuitState.toLowerCase()}`]}>
                Circuit: {this.circuitState}
              </span>
              <span className={styles['error-counter']}>
                Errors: {this.state.errorCount}/{this.errorThreshold}
              </span>
            </div>

            <p className={styles['mi-boundary-message']}>
              The Impulse system has encountered an error and activated protective measures. Our
              telemetry systems have been notified and are analyzing the issue.
            </p>

            {showDetails && this.state.error && (
              <div className={styles['mi-boundary-details']}>
                <div className={styles['error-header']}>
                  <h3>Technical Details</h3>
                  <span className={styles['error-id']}>ID: {this.state.errorId}</span>
                </div>
                <pre className={styles['error-content']}>
                  <strong>Error:</strong> {this.state.error.message}
                  {this.state.error.stack && (
                    <>
                      <br />
                      <br />
                      <strong>Stack Trace:</strong>
                      <br />
                      {this.state.error.stack}
                    </>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      <br />
                      <br />
                      <strong>Component Stack:</strong>
                      <br />
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </div>
            )}

            <div className={styles['mi-boundary-actions']}>
              {canRetry && (
                <button
                  className={`${styles['mi-boundary-button']} ${styles.primary}`}
                  onClick={this.handleRetry}
                  disabled={this.state.isRecovering}
                >
                  {this.state.isRecovering ? (
                    <>
                      <span className={styles['spinner']}></span>
                      Recovering System...
                    </>
                  ) : (
                    `Retry (${this.maxRetries - this.retryCount} left)`
                  )}
                </button>
              )}

              {this.circuitState === 'OPEN' && (
                <div className={styles['circuit-warning']}>
                  <span>System in protection mode. Please wait for automatic recovery.</span>
                </div>
              )}

              <button className={styles['mi-boundary-button']} onClick={this.handleRefresh}>
                System Restart
              </button>

              {showDetails && (
                <button className={styles['mi-boundary-button']} onClick={this.handleCopyError}>
                  Copy Error Report
                </button>
              )}
            </div>

            {this.state.isRecovering && (
              <div className={styles['recovery-animation']}>
                <div className={styles['recovery-progress']}>
                  <div className={styles['progress-bar']}></div>
                </div>
                <p>Impulse system recovery in progress...</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { MIBoundary };
export default MIBoundary;
