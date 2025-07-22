"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8 space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          {flow === "signIn" ? "Welcome Back 👋" : "Create an Account"}
        </h2>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitting(true);
            const formData = new FormData(e.target as HTMLFormElement);
            formData.set("flow", flow);
            void signIn("password", formData).catch((error) => {
              let toastTitle = "";
              if (error.message.includes("Invalid password")) {
                toastTitle = "Invalid password. Please try again.";
              } else {
                toastTitle =
                  flow === "signIn"
                    ? "Could not sign in, did you mean to sign up?"
                    : "Could not sign up, did you mean to sign in?";
              }
              toast.error(toastTitle);
              setSubmitting(false);
            });
          }}
        >
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              className="w-full px-4 py-3 mt-1 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              type="email"
              name="email"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              className="w-full px-4 py-3 mt-1 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              type="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>

         <button
  type="submit"
  className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-900 transition duration-200"
  disabled={submitting}
>
  {submitting ? "Please wait..." : flow === "signIn" ? "Sign In" : "Sign Up"}
</button>
        </form>

        <div className="flex items-center">
          <hr className="flex-grow border-gray-200" />
          <span className="mx-2 text-gray-400 text-sm">or</span>
          <hr className="flex-grow border-gray-200" />
        </div>

        <button
          onClick={() => void signIn("anonymous")}
          className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition duration-200"
        >
          Continue as Guest
        </button>

        <p className="text-center text-sm text-gray-600">
          {flow === "signIn" ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            className="text-primary font-semibold hover:underline ml-1"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
