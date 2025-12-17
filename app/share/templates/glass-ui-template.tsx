"use client"

import React, { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Check, Lock, ExternalLink, Download, Sparkles } from "lucide-react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

interface MiraTemplateProps {
  playStoreUrl: string
  googleGroupUrl: string
}

export default function GlassUiTemplate({ playStoreUrl, googleGroupUrl }: MiraTemplateProps) {
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

  const bg = useMemo(
    () => ({
      background:
        "radial-gradient(1200px 600px at 15% 10%, rgba(168, 85, 247, .25), transparent 60%)," +
        "radial-gradient(900px 500px at 85% 30%, rgba(34, 211, 238, .18), transparent 60%)," +
        "radial-gradient(900px 520px at 30% 90%, rgba(16, 185, 129, .14), transparent 60%)," +
        "linear-gradient(180deg, #06070b 0%, #070A12 40%, #06070b 100%)",
    }),
    []
  )

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-10 relative overflow-hidden" style={bg}>
      {/* floating orbs */}
      <Orb size={520} top="-220px" left="-160px" color="rgba(168,85,247,.35)" />
      <Orb size={420} top="30%" left="78%" color="rgba(34,211,238,.25)" />
      <Orb size={520} top="70%" left="-120px" color="rgba(16,185,129,.18)" />

      {/* subtle grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='260' height='260' filter='url(%23n)' opacity='.6'/%3E%3C/svg%3E\")",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="relative">
          {/* glow behind card */}
          <div className="absolute -inset-2 rounded-[32px] blur-2xl opacity-40 pointer-events-none"
            style={{ background: "linear-gradient(135deg, rgba(168,85,247,.35), rgba(34,211,238,.22), rgba(16,185,129,.18))" }} />

          <Card
            className="relative overflow-hidden"
            style={{
              borderRadius: 28,
              border: "1px solid rgba(255,255,255,0.12)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.06))",
              boxShadow:
                "0 24px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.14)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              padding: 22,
            }}
          >
            {/* top shine */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(900px 280px at 20% 0%, rgba(255,255,255,0.20), transparent 55%)",
              }}
            />

            <CardHeader className="text-center pb-5 relative z-10 space-y-2">
              <div className="flex items-center justify-center">
                <motion.div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.07))",
                    border: "1px solid rgba(255,255,255,0.14)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
                  }}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <motion.div
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Sparkles className="h-6 w-6 text-white/90" />
                  </motion.div>
                </motion.div>
              </div>

              <CardTitle
                style={{
                  fontSize: 26,
                  fontWeight: 850,
                  letterSpacing: -0.6,
                  color: "rgba(255,255,255,0.92)",
                }}
              >
                Beta Access
              </CardTitle>
              <CardDescription style={{ color: "rgba(255,255,255,0.62)", fontSize: 15 }}>
                Join the tester group, then install from Play Store.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-10 relative z-10">
              {/* vertical connector */}

              <GlassStep
                index={1}
                title="Join Google Group"
                status={step1Status}
                icon={<ExternalLink className="h-4 w-4" />}
              >
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    style={glassBtnOutline}
                    onClick={() => window.open(googleGroupUrl, "_blank")}
                  >
                    Open group page <ExternalLink className="ml-1 h-4 w-4 opacity-80" />
                  </Button>

                  <Button
                    className="w-full"
                    style={{
                      ...glassBtn,
                      background:
                        step1Status === "done"
                          ? "linear-gradient(135deg, rgba(16,185,129,.95), rgba(16,185,129,.75))"
                          : "linear-gradient(135deg, rgba(255,255,255,.16), rgba(255,255,255,.08))",
                      border:
                        step1Status === "done"
                          ? "1px solid rgba(16,185,129,.45)"
                          : "1px solid rgba(255,255,255,0.16)",
                    }}
                    disabled={checking || step1Status === "done"}
                    onClick={handleCheckMembership}
                  >
                    {step1Status === "done"
                      ? "Membership confirmed ✓"
                      : checking
                        ? "Checking…"
                        : "I have joined"}
                  </Button>
                </div>
              </GlassStep>

              <GlassStep
                index={2}
                title="Install the App"
                locked={step2Locked}
                status="idle"
                icon={<Download className="h-4 w-4" />}
                lockReason={step2Locked ? "Complete step 1 to unlock" : undefined}
              >
                <div className="space-y-3">
                  <Button
                    className="w-full"
                    style={{
                      ...glassBtn,
                      background: step2Locked
                        ? "linear-gradient(135deg, rgba(255,255,255,.10), rgba(255,255,255,.06))"
                        : "linear-gradient(135deg, rgba(34,211,238,.95), rgba(168,85,247,.85))",
                      border: "1px solid rgba(255,255,255,0.16)",
                      boxShadow: step2Locked ? "none" : "0 10px 22px rgba(0,0,0,0.35)",
                      opacity: step2Locked ? 0.7 : 1,
                    }}
                    disabled={step2Locked}
                    onClick={() => (window.location.href = playStoreUrl)}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download on Play Store
                  </Button>

                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.52)" }}>
                    Tip: If Play Store says “Not available”, re-check you joined the group with the same Google account.
                  </p>
                </div>
              </GlassStep>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}

/* ---------------- Step ---------------- */

function GlassStep({
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
      className="relative z-10"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{
        opacity: locked && !done ? 0.45 : 1,
        filter: locked && !done ? "grayscale(0.35)" : "none",
      }}
    >
      <div className="flex items-start gap-4">
        <motion.div
          className="flex items-center justify-center"
          style={{
            height: 44,
            width: 44,
            minWidth: 44,
            borderRadius: 14,
            border: done
              ? "1px solid rgba(16,185,129,.55)"
              : locked
                ? "1px solid rgba(255,255,255,0.10)"
                : "1px solid rgba(255,255,255,0.18)",
            background: done
              ? "linear-gradient(135deg, rgba(16,185,129,.95), rgba(16,185,129,.65))"
              : "linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.06))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)",
            color: "rgba(255,255,255,0.88)",
          }}
          animate={
            done
              ? { scale: [1, 1.06, 1] }
              : locked
                ? { scale: 1 }
                : { scale: [1, 1.02, 1] }
          }
          transition={{ duration: 2.2, repeat: done ? 0 : Infinity, ease: "easeInOut" }}
        >
          {done ? <Check className="h-5 w-5" /> : locked ? <Lock className="h-5 w-5 opacity-80" /> : icon}
        </motion.div>

        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[15px] font-extrabold tracking-[-0.3px]" style={{ color: "rgba(255,255,255,0.92)" }}>
              Step {index} · {title}
            </p>

            {done && (
              <span
                className="text-[11px] font-bold px-2 py-1 rounded-full"
                style={{
                  color: "rgba(16,185,129,0.95)",
                  background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.25)",
                }}
              >
                Done
              </span>
            )}
          </div>

          {lockReason && (
            <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
              {lockReason}
            </p>
          )}

          <div className="mt-4 pl-0">{children}</div>
        </div>
      </div>
    </motion.div>
  )
}

/* ---------------- Background Orb ---------------- */

function Orb({ size, top, left, color }: { size: number; top: string; left: string; color: string }) {
  return (
    <motion.div
      className="pointer-events-none absolute rounded-full blur-3xl"
      style={{ width: size, height: size, top, left, background: color, opacity: 0.85 }}
      initial={{ y: 0, scale: 1 }}
      animate={{ y: [-10, 10, -10], scale: [1, 1.03, 1] }}
      transition={{ duration: 16, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
    />
  )
}

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

/* ---------------- Mini shadcn clones (so file is self-contained) ---------------- */

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn("flex flex-col gap-6 rounded-xl border shadow-sm", className)}
      {...props}
    />
  )
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
    variants: {
      variant: {
        default: "",
        outline: "border",
      },
      size: {
        default: "h-10 px-4 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
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

/* ---------------- Glass button styles ---------------- */

const glassBtn: React.CSSProperties = {
  minHeight: 52,
  borderRadius: 18,
  color: "rgba(255,255,255,0.92)",
  letterSpacing: -0.2,
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
}

const glassBtnOutline: React.CSSProperties = {
  ...glassBtn,
  background: "linear-gradient(135deg, rgba(255,255,255,.10), rgba(255,255,255,.05))",
  border: "1px solid rgba(255,255,255,0.16)",
}
