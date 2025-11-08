'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className='flex min-h-screen items-center justify-center p-4'>
          <Card className='w-full max-w-md'>
            <CardHeader>
              <CardTitle className='text-red-600'>
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <p className='text-sm text-gray-600'>
                An unexpected error occurred. Please try again.
              </p>
              {this.state.error && (
                <details className='rounded-md bg-gray-50 p-3 text-xs'>
                  <summary className='cursor-pointer font-medium text-gray-700'>
                    Error details
                  </summary>
                  <pre className='mt-2 overflow-auto text-gray-600'>
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              <div className='flex gap-2'>
                <Button
                  onClick={() =>
                    this.setState({ hasError: false, error: null })
                  }
                  variant='outline'
                >
                  Try again
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Reload page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
