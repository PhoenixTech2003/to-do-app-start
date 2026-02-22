import { useState } from 'react'
import { Settings } from 'lucide-react'
import type { PomodoroSettings } from '@/dexie/db'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface PomodoroSettingsDialogProps {
  settings: Omit<PomodoroSettings, 'id'>
  onSave: (settings: Omit<PomodoroSettings, 'id'>) => void
}

export function PomodoroSettingsDialog({
  settings,
  onSave,
}: PomodoroSettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState<Omit<PomodoroSettings, 'id'>>(settings)

  function handleOpen(open: boolean) {
    if (open) setDraft(settings)
    setIsOpen(open)
  }

  function handleSave() {
    onSave({
      pomoDuration: Math.max(1, Math.min(120, draft.pomoDuration)),
      shortBreakDuration: Math.max(1, Math.min(60, draft.shortBreakDuration)),
      longBreakDuration: Math.max(1, Math.min(60, draft.longBreakDuration)),
      pomosBeforeLongBreak: Math.max(1, Math.min(12, draft.pomosBeforeLongBreak)),
    })
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleOpen(true)}
        aria-label="Pomodoro settings"
      >
        <Settings className="h-5 w-5" />
      </Button>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Timer Settings</DialogTitle>
          <DialogDescription>
            Customize your pomodoro and break durations.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="pomo-duration">Focus duration (min)</Label>
            <Input
              id="pomo-duration"
              type="number"
              min={1}
              max={120}
              value={draft.pomoDuration}
              onChange={(e) =>
                setDraft((d) => ({ ...d, pomoDuration: Number(e.target.value) }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="short-break">Short break (min)</Label>
            <Input
              id="short-break"
              type="number"
              min={1}
              max={60}
              value={draft.shortBreakDuration}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  shortBreakDuration: Number(e.target.value),
                }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="long-break">Long break (min)</Label>
            <Input
              id="long-break"
              type="number"
              min={1}
              max={60}
              value={draft.longBreakDuration}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  longBreakDuration: Number(e.target.value),
                }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pomo-count">Pomos before long break</Label>
            <Input
              id="pomo-count"
              type="number"
              min={1}
              max={12}
              value={draft.pomosBeforeLongBreak}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  pomosBeforeLongBreak: Number(e.target.value),
                }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
