"use client";
import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function SalesforceCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const errorParam = params.get("error");

      if (errorParam) {
        const desc = params.get("error_description") || errorParam;
        setError(desc);
        setStatus("error");
        window.opener?.postMessage({ type: "sf-oauth-error", error: desc }, window.location.origin);
        return;
      }

      if (!code) {
        setError("No authorization code received");
        setStatus("error");
        return;
      }

      try {
        // Exchange the code for an access token via our server-side endpoint
        const callbackUrl = `${window.location.origin}/salesforce-callback`;
        const res = await fetch("/api/salesforce/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, callbackUrl }),
        });

        if (res.ok) {
          const data = await res.json();
          // Send the token back to the parent window
          window.opener?.postMessage(
            {
              type: "sf-oauth-success",
              accessToken: data.accessToken,
              instanceUrl: data.instanceUrl,
            },
            window.location.origin
          );
          setStatus("success");
          // Auto-close popup after a moment
          setTimeout(() => window.close(), 1000);
        } else {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Token exchange failed");
        }
      } catch (e: unknown) {
        const msg = (e as Error).message || "Authentication failed";
        setError(msg);
        setStatus("error");
        window.opener?.postMessage({ type: "sf-oauth-error", error: msg }, window.location.origin);
      }
    }

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f1729] flex items-center justify-center text-white">
      <div className="text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-[#94a3b8]">Connecting to Salesforce...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
            <p className="text-emerald-400 font-medium">Connected! This window will close.</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 font-medium mb-2">Connection failed</p>
            <p className="text-[#64748b] text-sm">{error}</p>
            <button
              onClick={() => window.close()}
              className="mt-4 px-4 py-2 bg-[#1a2234] border border-[#2a3a55] rounded-lg text-sm hover:bg-[#1e2840] transition"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
