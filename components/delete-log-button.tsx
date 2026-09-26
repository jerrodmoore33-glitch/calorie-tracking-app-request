'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteLog } from '@/app/actions/logs'
import { Button } from '@/components/ui/button'

export function DeleteLogButton({ id, name }: { id: number; name: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={pending}
      onClick={() => startTransition(() => deleteLog(id))}
      aria-label={`Remove ${name}`}
      className="text-muted-foreground hover:text-destructive"
    >
      <Trash2 />
    </Button>
  )
}
