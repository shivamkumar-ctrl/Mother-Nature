import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { HelpCircle, ChevronDown, ChevronUp, Mail, Phone } from "lucide-react";

const FAQS = [
  {
    q: "How do I place an order?",
    a: "Browse our Plants, Trees, or Seeds sections, add items to your cart, then proceed to checkout. You'll need to log in with your account to complete the order.",
  },
  {
    q: "Can I cancel my order?",
    a: "Yes — you can cancel an order within 2 hours of placing it, as long as it hasn't been shipped yet. Go to Orders in your account and click 'Cancel Order'.",
  },
  {
    q: "How long does delivery take?",
    a: "Most orders are delivered within 3–5 business days. Larger trees may take 5–7 days. You'll receive a notification when your order is dispatched.",
  },
  {
    q: "Do you ship outside the city?",
    a: "We currently ship within the city and surrounding districts. For outstation orders, please contact us directly and we'll try our best to accommodate.",
  },
  {
    q: "How should I care for my plants after delivery?",
    a: "Each product page includes a care guide covering sunlight, watering frequency, and general tips. We recommend keeping plants in shade for the first day to help them adjust.",
  },
  {
    q: "Are your plants grown organically?",
    a: "We source from nurseries that use minimal chemical inputs. Our medicinal herbs are grown fully organically. Product descriptions note where certified organic practices apply.",
  },
  {
    q: "What if my plant arrives damaged?",
    a: "Please take a photo and contact us within 24 hours of delivery. We'll arrange a replacement or refund at no extra cost.",
  },
  {
    q: "How do I track my order?",
    a: "Log in to your account and visit the Orders page. Each order shows its current status: pending, processing, shipped, or delivered.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="text-sm font-medium text-foreground pr-4">{q}</span>
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t bg-muted/20">
          <p className="pt-3">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function Help() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center">
              <HelpCircle className="h-7 w-7 text-primary" />
            </div>
          </div>
          <h1 className="font-serif text-4xl font-semibold text-foreground mb-3">Help Centre</h1>
          <p className="text-muted-foreground">Answers to common questions about ordering, delivery, and plant care.</p>
        </div>

        {/* FAQ */}
        <section className="space-y-3 mb-14">
          {FAQS.map(({ q, a }) => (
            <FaqItem key={q} q={q} a={a} />
          ))}
        </section>

        {/* Contact CTA */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
          <h2 className="font-serif text-xl font-medium text-foreground mb-2">Still need help?</h2>
          <p className="text-sm text-muted-foreground mb-6">Reach out and we'll get back to you within one business day.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:hello@mothernaturenursery.in"
              className="flex items-center gap-2 justify-center px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Email us
            </a>
            <a
              href="tel:+919876543210"
              className="flex items-center gap-2 justify-center px-5 py-2.5 text-sm font-medium border rounded-lg hover:bg-muted transition-colors text-foreground"
            >
              <Phone className="h-4 w-4" />
              Call us
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
