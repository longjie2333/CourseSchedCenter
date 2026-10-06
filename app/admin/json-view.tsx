import { lazy, Suspense, useSyncExternalStore } from 'react'
import { cn } from '~/lib/utils.ts'

const ReactJson = lazy(() => import('@microlink/react-json-view'))

/** Never notifies: the snapshot only has to flip once, when hydration finishes. */
const subscribeToNothing = () => () => {}

const jsonViewStyle = {
  backgroundColor: 'transparent',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.75rem',
  lineHeight: '1.25rem',
}

export interface JsonViewProps {
  src: object
  collapsed?: boolean | number
  className?: string
}

/**
 * `react-json-view` reads from `document` while loading, so it is imported on the
 * client only. Both the server render and the first client render use the plain
 * `<pre>` fallback, which keeps hydration stable.
 */
export function JsonView({ src, collapsed = false, className }: JsonViewProps) {
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  )

  const fallback = (
    <pre className={cn('overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs leading-5', className)}>
      {JSON.stringify(src, null, 2)}
    </pre>
  )

  if (!mounted) return fallback

  return (
    <Suspense fallback={fallback}>
      <div className={cn('overflow-x-auto font-mono text-xs [&_.object-key-val]:border-l-border!', className)}>
        <ReactJson
          collapsed={collapsed}
          displayDataTypes={false}
          displayObjectSize={false}
          enableClipboard={false}
          name={false}
          src={src}
          style={jsonViewStyle}
        />
      </div>
    </Suspense>
  )
}
