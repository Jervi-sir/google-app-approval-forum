"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Check, Lock, ExternalLink, Download, Package } from "lucide-react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

interface TemplateProps {
  playStoreUrl: string
  googleGroupUrl: string
}

export default function MinimalistFournitureTemplate({ playStoreUrl, googleGroupUrl }: TemplateProps) {
  const [step1Status, setStep1Status] = useState<"idle" | "loading" | "done">("idle")
  const [checking, setChecking] = useState(false)

  const step2Locked = step1Status !== "done"

  const handleCheckMembership = async () => {
    setChecking(true)
    setStep1Status("loading")
    await delay(900)
    setStep1Status("done")
    setChecking(false)
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(1200px 700px at 20% 10%, rgba(227, 211, 180, 0.55), transparent 60%)," +
          "radial-gradient(900px 520px at 85% 40%, rgba(205, 214, 201, 0.55), transparent 60%)," +
          "linear-gradient(180deg, #F6F2EA 0%, #F2EDE4 40%, #F6F2EA 100%)",
      }}
    >
      {/* subtle paper grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='320'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='320' height='320' filter='url(%23n)' opacity='.6'/%3E%3C/svg%3E\")",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="relative">
          {/* “wood edge” shadow */}
          <div
            className="absolute -inset-[10px] rounded-[30px] opacity-60 blur-xl pointer-events-none"
            style={{
              background:
                "radial-gradient(800px 220px at 20% 0%, rgba(116, 89, 59, 0.22), transparent 60%)," +
                "radial-gradient(800px 240px at 90% 100%, rgba(116, 89, 59, 0.18), transparent 60%)",
            }}
          />

          <Card
            className="relative overflow-hidden"
            style={{
              borderRadius: 26,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.88), rgba(252, 250, 246, 0.92))",
              border: "1px solid rgba(94, 74, 50, 0.18)",
              boxShadow: "0 22px 55px rgba(40, 30, 20, 0.18)",
              padding: 22,
            }}
          >
            {/* top stitching line */}
            <div
              className="pointer-events-none absolute left-0 right-0 top-0 h-[10px]"
              style={{
                background:
                  "repeating-linear-gradient(90deg, rgba(94,74,50,0.16), rgba(94,74,50,0.16) 6px, transparent 6px, transparent 12px)",
                opacity: 0.45,
              }}
            />

            <CardHeader className="text-center pb-4 space-y-2">
              <motion.div
                className="mx-auto h-12 w-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(116,89,59,0.12), rgba(116,89,59,0.05))",
                  border: "1px solid rgba(116,89,59,0.20)",
                }}
                initial={{ scale: 0.9, rotate: -6, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <Package className="h-6 w-6" style={{ color: "#5E4A32" }} />
              </motion.div>

              <CardTitle style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.6, color: "#2D241A" }}>
                Early Access
              </CardTitle>
              <CardDescription style={{ color: "#6B5C4A", fontSize: 15 }}>
                Two steps. Warm & simple. Like good furniture.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-10 relative">
              {/* thin “rope” connector */}

              <StepRow
                index={1}
                title="Join the Google Group"
                status={step1Status}
                icon={<ExternalLink className="h-4 w-4" />}
              >
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    style={btnOutline}
                    onClick={() => window.open(googleGroupUrl, "_blank")}
                  >
                    Open group page <ExternalLink className="ml-1 h-4 w-4 opacity-70" />
                  </Button>

                  <Button
                    className="w-full"
                    style={{
                      ...btnPrimary,
                      background:
                        step1Status === "done"
                          ? "linear-gradient(180deg, #1F7A4A 0%, #16603A 100%)"
                          : "linear-gradient(180deg, #FFFFFF 0%, #FBF7F0 100%)",
                      color: step1Status === "done" ? "#FFFFFF" : "#2D241A",
                      border:
                        step1Status === "done"
                          ? "1px solid rgba(31, 122, 74, 0.35)"
                          : "1px dashed rgba(94,74,50,0.45)",
                    }}
                    disabled={checking || step1Status === "done"}
                    onClick={handleCheckMembership}
                  >
                    {step1Status === "done" ? "Joined ✓" : checking ? "Verifying…" : "I have joined"}
                  </Button>
                </div>
              </StepRow>

              <StepRow
                index={2}
                title="Get the app"
                locked={step2Locked}
                status="idle" // always idle (never shows done)
                icon={<Download className="h-4 w-4" />}
                lockReason={step2Locked ? "Finish step 1 to unlock" : undefined}
              >
                <div className="space-y-3">
                  <Button
                    className="w-full"
                    style={{
                      ...btnPrimary,
                      background: step2Locked
                        ? "linear-gradient(180deg, #F3EEE6 0%, #ECE6DC 100%)"
                        : "linear-gradient(180deg, #5E4A32 0%, #463522 100%)",
                      color: step2Locked ? "rgba(45,36,26,0.55)" : "#FFF8F0",
                      border: "1px solid rgba(94,74,50,0.25)",
                      boxShadow: step2Locked ? "none" : "0 10px 18px rgba(40,30,20,0.18)",
                    }}
                    disabled={step2Locked}
                    onClick={() => (window.location.href = playStoreUrl)}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download on Play Store
                  </Button>

                </div>
              </StepRow>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}

/* ---------------- Step row ---------------- */

function StepRow({
  index,
  title,
  status = "idle",
  children,
  locked,
  lockReason,
  icon,
}: any) {
  const done = status === "done"

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      style={{
        opacity: locked && !done ? 0.55 : 1,
        filter: locked && !done ? "grayscale(0.25)" : "none",
      }}
    >
      <div className="flex items-start gap-4">
        <motion.div
          className="flex items-center justify-center"
          style={{
            height: 44,
            width: 44,
            minWidth: 44,
            borderRadius: 16,
            background: done ? "linear-gradient(180deg, #1F7A4A 0%, #16603A 100%)" : "rgba(94,74,50,0.06)",
            border: done
              ? "1px solid rgba(31,122,74,0.35)"
              : locked
                ? "1px solid rgba(94,74,50,0.12)"
                : "1px solid rgba(94,74,50,0.20)",
            color: done ? "#FFFFFF" : "#5E4A32",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55)",
          }}
          animate={done ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {done ? <Check className="h-5 w-5" /> : locked ? <Lock className="h-5 w-5 opacity-70" /> : icon}
        </motion.div>

        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <p style={{ fontSize: 15, fontWeight: 950, letterSpacing: -0.2, color: "#2D241A" }}>
              Step {index} · {title}
            </p>

            {done && (
              <span
                className="text-[11px] font-black px-2 py-1 rounded-full"
                style={{
                  color: "#1F7A4A",
                  background: "rgba(31,122,74,0.10)",
                  border: "1px solid rgba(31,122,74,0.18)",
                }}
              >
                Done
              </span>
            )}
          </div>

          {lockReason && (
            <p className="mt-1 text-xs" style={{ color: "#7A6A58", fontWeight: 700 }}>
              {lockReason}
            </p>
          )}

          <div className="mt-4">{children}</div>
        </div>
      </div>
    </motion.div>
  )
}

/* ---------------- util ---------------- */

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

/* ---------------- tiny shadcn-ish clones (self-contained) ---------------- */

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card" className={cn("flex flex-col gap-6 rounded-xl border", className)} {...props} />
}
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("grid gap-2 px-6", className)} {...props} />
}
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-title" className={cn("leading-none font-semibold", className)} {...props} />
}
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-sm text-muted-foreground", className)} {...props} />
}
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-6", className)} {...props} />
}

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-50 outline-none",
  {
    variants: { variant: { default: "", outline: "border" }, size: { default: "h-10 px-4 py-2" } },
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

/* ---------------- styles ---------------- */

const btnPrimary: React.CSSProperties = {
  minHeight: 52,
  borderRadius: 18,
  letterSpacing: -0.2,
}

const btnOutline: React.CSSProperties = {
  minHeight: 52,
  borderRadius: 18,
  background: "transparent",
  border: "1px solid rgba(94,74,50,0.25)",
  color: "#2D241A",
}
