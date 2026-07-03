import * as React from 'react'
import { cn } from '@/lib/utils'

const Button = React.forwardRef(({ className, type = 'button', ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 focus:outline-none disabled:pointer-events-none disabled:opacity-50',
      className
    )}
    {...props}
  />
))
Button.displayName = 'Button'

export { Button }
