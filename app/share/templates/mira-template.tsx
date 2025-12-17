"use client"

import React, { useState } from "react"
import { Check, Lock, PawPrint, Bone, Download, Cat } from "lucide-react"
import { motion } from "framer-motion"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

interface MiraTemplateProps {
  playStoreUrl: string
  googleGroupUrl: string
}

export default function MiraTemplate({ playStoreUrl, googleGroupUrl }: MiraTemplateProps) {
  // Step 1 = join group + confirm
  const [step1Status, setStep1Status] = useState<"idle" | "loading" | "done">("idle")
  const [checkingMembership, setCheckingMembership] = useState(false)

  // Step 2 = download (enabled when step1Status === "done")
  const step2Locked = step1Status !== "done"

  const handleCheckMembership = async () => {
    setCheckingMembership(true)
    setStep1Status("loading")
    await fakeDelay(1000)
    setStep1Status("done") // ✅ this marks step 1 done
    setCheckingMembership(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{ backgroundColor: "#FFF5E9" }}
    >
      {/* Animated background bubbles */}
      <AnimatedBubble
        size={260}
        top="-10%"
        left="-10%"
        delay={0}
        duration={18}
        opacity={0.35}
        from="#FFE4C7"
        to="#FFD2A1"
      />
      <AnimatedBubble
        size={200}
        top="70%"
        left="-5%"
        delay={2}
        duration={22}
        opacity={0.32}
        from="#E5ECFF"
        to="#C7D5FF"
      />
      <AnimatedBubble
        size={220}
        top="10%"
        left="70%"
        delay={1}
        duration={20}
        opacity={0.3}
        from="#FFE2EB"
        to="#FFC4D7"
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.95, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card
          className="w-full relative overflow-hidden backdrop-blur-xl"
          style={{
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.96), rgba(247,244,255,0.96))",
            borderRadius: 32,
            border: "1px solid rgba(85, 96, 138, 0.25)",
            padding: 24,
            boxShadow: "0 22px 45px rgba(51, 58, 90, 0.28)",
          }}
        >
          {/* soft glow */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-16 left-10 h-40 w-40 rounded-full blur-3xl opacity-40 bg-[#FFE0C7]" />
            <div className="absolute bottom-[-40px] right-[-40px] h-40 w-40 rounded-full blur-3xl opacity-30 bg-[#C7D5FF]" />
          </div>

          {/* Decorative top paw */}
          <motion.div
            className="absolute -top-6 -right-6 opacity-10 rotate-12"
            animate={{ rotate: [10, 18, 10] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            <PawPrint size={120} color="#333A5A" />
          </motion.div>

          <CardHeader className="space-y-2 pb-6 text-center relative z-10">
            <CardTitle
              className="flex flex-col items-center gap-3"
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#333A5A",
              }}
            >
              <motion.div
                className="h-14 w-14 bg-[#55608A20] rounded-full flex items-center justify-center mb-1 text-[#333A5A]"
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, delay: 0.1, type: "spring" }}
              >
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Cat size={32} strokeWidth={2.5} />
                </motion.div>
              </motion.div>
              Join the Pack
            </CardTitle>

            <CardDescription style={{ fontSize: 16, color: "#55608A" }}>
              Become a beta tester in 2 easy steps!
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-12 relative z-10">
            {/* Connector Line behind steps */}
            <motion.div
              className="absolute left-[50px] top-4 bottom-10 w-[3px] rounded-full bg-gradient-to-b from-[#55608A80] via-[#55608A40] to-transparent"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              style={{ transformOrigin: "top" }}
              transition={{ duration: 0.9, delay: 0.1, ease: "easeOut" }}
            />

            {/* STEP 1 */}
            <Step
              index={1}
              title="Join Google Group"
              status={step1Status}
              icon={<PawPrint size={18} />}
            >
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.4, delay: 0.15 }}
              >
                <Button
                  className="w-full hover:bg-orange-50 hover:text-orange-700 cursor-pointer transition-transform"
                  variant="outline"
                  style={{
                    minHeight: 50,
                    borderRadius: 999,
                    borderColor: "#55608A50",
                    borderWidth: 2,
                    color: "#333A5A",
                    fontSize: 15,
                    fontWeight: 700,
                    backgroundColor: "transparent",
                  }}
                  onClick={() => window.open(googleGroupUrl, "_blank")}
                >
                  Go to Group Page
                </Button>

                <Button
                  className="w-full transition-all cursor-pointer font-bold"
                  style={{
                    minHeight: 50,
                    borderRadius: 999,
                    backgroundColor: step1Status === "done" ? "#10B981" : "#FFF7ED",
                    color: step1Status === "done" ? "white" : "#333A5A",
                    border: step1Status === "done" ? "none" : "2px dashed #333A5A",
                    fontSize: 15,
                  }}
                  disabled={checkingMembership || step1Status === "done"}
                  onClick={handleCheckMembership}
                >
                  {step1Status === "done"
                    ? "You're in the pack! ✓"
                    : checkingMembership
                      ? "Sniffing for membership…"
                      : "I have joined"}
                </Button>
              </motion.div>
            </Step>

            {/* STEP 2 (enabled but NOT shown as done) */}
            <Step
              index={2}
              title="Get the App"
              locked={step2Locked}
              status={"idle"} // 👈 always idle (never shows done)
              icon={<Bone size={18} />}
              lockReason={step2Locked ? "Join the group first to unlock" : undefined}
            >
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.8, delay: 0.2 }}
              >
                <Button
                  className="w-full transition-all cursor-pointer"
                  style={{
                    minHeight: 54,
                    borderRadius: 24,
                    backgroundColor: "#10B981",
                    color: "#FFFFFF",
                    fontSize: 16,
                    fontWeight: 700,
                    boxShadow: "0 4px 0 #047857",
                  }}
                  disabled={step2Locked}
                  onClick={() => (window.location.href = playStoreUrl)}
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download on Play Store
                </Button>
              </motion.div>
            </Step>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

/* ---------------- Step Component ---------------- */

function Step({
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
      className="space-y-3 relative z-10"
      style={{
        opacity: locked && !done ? 0.45 : 1,
        filter: locked && !done ? "grayscale(0.4)" : "none",
      }}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      layout
    >
      <div className="flex items-center gap-4">
        <motion.div
          className="flex items-center justify-center transition-colors duration-700"
          style={{
            height: 56,
            width: 56,
            minWidth: 56,
            borderRadius: 999,
            border: done ? "none" : locked ? "2px solid #E5E7EB" : "2px solid #55608A",
            backgroundColor: done ? "#10B981" : locked ? "#F3F4F6" : "#FFF7ED",
            color: done ? "white" : locked ? "#9CA3AF" : "#333A5A",
          }}
          animate={
            done
              ? {
                scale: [1, 1.1, 1],
                boxShadow: [
                  "0 0 0px rgba(16,185,129,0.0)",
                  "0 0 18px rgba(16,185,129,0.55)",
                  "0 0 0px rgba(16,185,129,0.0)",
                ],
              }
              : locked
                ? { scale: 1 }
                : { scale: [1, 1.03, 1] }
          }
          transition={{
            duration: done ? 0.9 : 2.5,
            repeat: done ? 0 : Infinity,
            ease: "easeInOut",
          }}
        >
          {done ? <Check size={28} strokeWidth={3} /> : locked ? <Lock size={24} /> : icon || <PawPrint size={24} />}
        </motion.div>

        <div className="flex-1">
          <p style={{ fontSize: 18, fontWeight: 700, color: "#333A5A" }}>
            Step {index} · {title}
          </p>

          {lockReason && (
            <p className="flex items-center gap-1" style={{ fontSize: 13, color: "#333A5A", fontWeight: 500 }}>
              {lockReason}
            </p>
          )}
        </div>
      </div>

      <div className="pl-[72px]">{children}</div>
    </motion.div>
  )
}

/* ---------------- Animated Bubble ---------------- */

type BubbleProps = {
  size: number
  top: string
  left: string
  delay?: number
  duration?: number
  opacity?: number
  from: string
  to: string
}

function AnimatedBubble({
  size,
  top,
  left,
  delay = 0,
  duration = 20,
  opacity = 0.3,
  from,
  to,
}: BubbleProps) {
  return (
    <motion.div
      className="absolute rounded-full blur-3xl"
      style={{
        top,
        left,
        width: size,
        height: size,
        opacity,
        background: `radial-gradient(circle at 30% 30%, ${from}, ${to})`,
      }}
      initial={{ y: 0, scale: 1 }}
      animate={{ y: [-10, 10, -10], scale: [1, 1.05, 1] }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      }}
    />
  )
}

/* ---------------- Util ---------------- */

function fakeDelay(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}


/** ------------------------
* Components
* ------------------------- */

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
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

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
