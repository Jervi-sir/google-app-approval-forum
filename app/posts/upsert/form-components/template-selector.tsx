"use client"

import React, { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

export type TemplateItem = {
  name: string
  code: string
  image?: string
  content?: string
}

interface TemplateSelectorProps {
  templateName: string
  setTemplateName: (v: string) => void
  templateCode: string
  setTemplateCode: (v: string) => void
  setContent?: (v: string) => void
}

export function TemplateSelector({
  templateName,
  setTemplateName,
  templateCode,

  setTemplateCode,
  setContent,
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<TemplateItem[]>([])

  useEffect(() => {
    fetch("/api/templates")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTemplates(data)
      })
      .catch((err) => console.error(err))
  }, [])

  return (
    <div className="space-y-3">
      <Label>Template (Optional)</Label>
      <div className="rounded-md border p-3 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1 space-y-2">
          <Select
            value={templateName}
            onValueChange={(val: string) => {
              setTemplateName(val)
              const found = templates.find((t) => t.name === val)
              if (found) {
                setTemplateCode(found.code)
                // Auto-fill content if provided and setContent is available
                // Only fill if there is content in the template
                if (setContent && found.content) {
                  // We could check if content is empty before overwriting, 
                  // but user presumably wants the template format. 
                  // Maybe append or replace? Let's replace for now as it's a "Template".
                  setContent(found.content)
                }
              } else {
                setTemplateCode("")
              }
            }}
          >
            <Select.Trigger className="w-full">
              <Select.Value placeholder="Select a template..." />
            </Select.Trigger>
            <Select.Content>
              {templates.map((t) => (
                <Select.Item key={t.code} value={t.name}>
                  {t.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
          <p className="text-xs text-muted-foreground">
            Auto-assigns code: <span className="font-mono">{templateCode || "None"}</span>
          </p>
        </div>

        {/* Selected Template Preview */}
        {templateName && (
          <div className="w-full sm:w-64 shrink-0 rounded-lg border bg-muted/40 p-2">
            {(() => {
              const t = templates.find((t) => t.name === templateName)
              if (!t) return null
              return (
                <div className="space-y-2">
                  <div className="aspect-video w-full overflow-hidden rounded-md bg-muted">
                    {t.image ? (
                      <img src={t.image} alt={t.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="space-y-0.5 px-1">
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.code}</div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
