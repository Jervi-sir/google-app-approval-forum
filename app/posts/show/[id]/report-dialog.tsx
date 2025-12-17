"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Flag } from "lucide-react"

export function ReportDialog({ targetLabel }: { targetLabel: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="md" className="gap-2">
          <Flag className="h-4 w-4" />
          Report
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Report {targetLabel}</DialogTitle>
          <DialogDescription>
            Help us keep the community clean. Pick a reason and add optional details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Reason</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  Select reason <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
                <DropdownMenuItem>Spam</DropdownMenuItem>
                <DropdownMenuItem>Malware</DropdownMenuItem>
                <DropdownMenuItem>Hate</DropdownMenuItem>
                <DropdownMenuItem>Harassment</DropdownMenuItem>
                <DropdownMenuItem>Copyright</DropdownMenuItem>
                <DropdownMenuItem>Other</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-message">Message (optional)</Label>
            <Textarea
              id="report-message"
              placeholder="Add details (optional)…"
              className="min-h-[110px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Submit report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
