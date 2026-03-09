import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DemoPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Book a Demo</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Schedule a personalized demo with our team to see how Haigent.ai can
            transform your business
          </p>
        </div>

        <div className="rounded-lg border bg-card p-8 shadow-lg">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">
                Demo Booking Form
              </h2>
              <p className="text-muted-foreground mb-6">
                Fill out the form below and our team will reach out to schedule
                your personalized demo.
              </p>
            </div>

            <form className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium leading-none"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium leading-none"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="company"
                  className="text-sm font-medium leading-none"
                >
                  Company Name
                </label>
                <input
                  id="company"
                  type="text"
                  placeholder="Acme Inc."
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="message"
                  className="text-sm font-medium leading-none"
                >
                  Additional Information
                </label>
                <textarea
                  id="message"
                  rows={4}
                  placeholder="Tell us about your use case or any specific questions..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  style={{ textShadow: "0 1px 2px rgba(255,255,255,0.5)" }}
                >
                  Submit Demo Request
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Our team typically responds within 24 hours
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
