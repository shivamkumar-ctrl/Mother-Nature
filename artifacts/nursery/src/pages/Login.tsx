import React from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Sprout } from "lucide-react";

export default function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 bg-card border rounded-2xl shadow-xl text-center space-y-8">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-accent rounded-full flex items-center justify-center text-primary">
              <Sprout className="h-8 w-8" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-serif text-primary">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to your Bloom & Root account to track orders and save your favorite plants.</p>
          </div>
          
          <div className="pt-4 pb-2">
            <Button size="lg" className="w-full h-12 text-lg" onClick={() => login()}>
              Log In securely
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            By logging in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
