import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Leaf, CheckCircle, Shield } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();

  const handleAllow = () => {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("returnTo") || "/";
    window.location.href = `/api/login?returnTo=${encodeURIComponent(returnTo)}`;
  };

  const handleDeny = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card border rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-primary/5 border-b p-6 text-center space-y-3">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Leaf className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-base font-semibold text-primary font-serif">Mother Nature</p>
              <p className="text-lg font-medium text-foreground mt-1">
                would like to access your account
              </p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground font-medium">This will allow Mother Nature to:</p>
            <ul className="space-y-3">
              {[
                "View your name and email address",
                "Manage your orders and shopping cart",
                "Save your wishlist and preferences",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="px-6 pb-4 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleDeny}>
              Deny
            </Button>
            <Button className="flex-1" onClick={handleAllow}>
              Allow Access
            </Button>
          </div>

          <div className="flex items-center justify-center gap-1.5 pb-5 px-6 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>Secured by Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
}
