"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Search, Building2, Users, MapPin, X, ChevronRight,
  Loader2, AlertCircle, Plus, ArrowLeft, User, Check, LogIn
} from "lucide-react";

function mapSfIndustry(industry) {
  if (!industry) return "";
  const i = industry.toLowerCase();
  if (i.includes("transport") || i.includes("trucking") || i.includes("logistics"))
    return "Private Fleet/Shipper";
  if (i.includes("broker") || i.includes("3pl") || i.includes("freight"))
    return "Brokerage/3PL";
  if (i.includes("maintenance") || i.includes("service"))
    return "Maintenance Service Center";
  if (i.includes("fuel") || i.includes("energy") || i.includes("oil") || i.includes("gas"))
    return "Fuel/Energy";
  if (i.includes("auto") || i.includes("vehicle"))
    return "Autohauler";
  return "";
}

export default function SalesforceSearchModal({ open, onClose, onCreateScope }) {
  const [step, setStep] = useState(1);
  // OAuth token (from popup flow)
  const [sfToken, setSfToken] = useState(null); // { accessToken, instanceUrl }
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [sfConfigured, setSfConfigured] = useState(null); // null = loading, true/false
  // Search
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  // Account detail
  const [accountDetail, setAccountDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [selectedContacts, setSelectedContacts] = useState({});
  const [fleetName, setFleetName] = useState("");
  // Blank scope
  const [blankName, setBlankName] = useState("");
  const [creating, setCreating] = useState(false);

  function getSfHeaders() {
    if (!sfToken) return {};
    return {
      "x-sf-access-token": sfToken.accessToken,
      "x-sf-instance-url": sfToken.instanceUrl,
    };
  }

  // Listen for OAuth popup messages
  const handleOAuthMessage = useCallback((event) => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type === "sf-oauth-success") {
      setSfToken({
        accessToken: event.data.accessToken,
        instanceUrl: event.data.instanceUrl,
      });
      setConnecting(false);
      setConnectError("");
      setStep(3); // Go straight to search
    } else if (event.data?.type === "sf-oauth-error") {
      setConnecting(false);
      setConnectError(event.data.error || "Authentication failed");
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, [handleOAuthMessage]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setSfToken(null);
      setConnecting(false);
      setConnectError("");
      setSfConfigured(null);
      setQuery("");
      setResults([]);
      setSearchError("");
      setAccountDetail(null);
      setSelectedContacts({});
      setFleetName("");
      setBlankName("");
      setCreating(false);
      // Check if SF is configured
      fetch("/api/salesforce/status")
        .then((r) => r.ok ? r.json() : { configured: false })
        .then((d) => setSfConfigured(d.configured))
        .catch(() => setSfConfigured(false));
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (step !== 3 || query.length < 2 || !sfToken) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      setSearchError("");
      try {
        const res = await fetch(`/api/salesforce/search?q=${encodeURIComponent(query)}`, {
          headers: getSfHeaders(),
        });
        if (res.ok) {
          setResults(await res.json());
        } else {
          const err = await res.json().catch(() => ({}));
          setSearchError(err.error || "Search failed");
        }
      } catch {
        setSearchError("Network error");
      }
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, step, sfToken]);

  const handleConnectSalesforce = async () => {
    setConnecting(true);
    setConnectError("");
    try {
      const callbackUrl = `${window.location.origin}/salesforce-callback`;
      const res = await fetch(`/api/salesforce/status?callback=${encodeURIComponent(callbackUrl)}`);
      const data = await res.json();
      if (!data.authUrl) {
        setConnectError("Salesforce Connected App not configured. Add SF_CLIENT_ID to .env");
        setConnecting(false);
        return;
      }
      // Open popup
      const w = 600, h = 700;
      const left = window.screenX + (window.innerWidth - w) / 2;
      const top = window.screenY + (window.innerHeight - h) / 2;
      const popup = window.open(
        data.authUrl,
        "salesforce-oauth",
        `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no`
      );
      // Watch for popup close without completing
      const timer = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(timer);
          if (!sfToken) {
            setConnecting(false);
          }
        }
      }, 500);
    } catch {
      setConnectError("Network error");
      setConnecting(false);
    }
  };

  const selectAccount = async (account) => {
    setLoadingDetail(true);
    setDetailError("");
    setStep(4);
    try {
      const res = await fetch(`/api/salesforce/accounts/${account.Id}`, {
        headers: getSfHeaders(),
      });
      if (res.ok) {
        const detail = await res.json();
        setAccountDetail(detail);
        setFleetName(detail.account.Name);
        const sel = {};
        detail.contacts.forEach((c) => { sel[c.Id] = true; });
        setSelectedContacts(sel);
      } else {
        const err = await res.json().catch(() => ({}));
        setDetailError(err.error || "Failed to load account details");
      }
    } catch {
      setDetailError("Network error");
    }
    setLoadingDetail(false);
  };

  const toggleContact = (id) => {
    setSelectedContacts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateFromSf = async () => {
    if (!accountDetail) return;
    setCreating(true);
    const acct = accountDetail.account;
    const location = [acct.BillingCity, acct.BillingState].filter(Boolean).join(", ");
    const contacts = accountDetail.contacts
      .filter((c) => selectedContacts[c.Id])
      .map((c) => ({
        name: c.Name || "",
        title: c.Title || "",
        email: c.Email || "",
        phone: c.Phone || "",
        role_title: c.Title || "",
      }));

    await onCreateScope(fleetName || acct.Name, {
      sf_account_id: acct.Id,
      hq_location: location,
      company_website: acct.Website || "",
      type_of_company: mapSfIndustry(acct.Industry),
      account_executive: acct.Owner?.Name || "",
      sf_opportunity_link: `${accountDetail.instanceUrl}/${acct.Id}`,
      executive_sponsor_name: "",
      executive_sponsor_title: "",
      contacts,
    });
  };

  const handleCreateBlank = async () => {
    if (!blankName.trim()) return;
    setCreating(true);
    await onCreateScope(blankName, null);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            {((step === 3 || step === 4) && !creating) && (
              <button
                onClick={() => setStep(step === 4 ? 3 : 1)}
                className="text-[var(--text-secondary)] hover:text-[var(--text)] transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg font-bold">
              {step === 1 && "New Scoping Document"}
              {step === "blank" && "New Scoping Document"}
              {step === 3 && "Search Salesforce"}
              {step === 4 && "Preview Account Data"}
              {step === 5 && "Creating Scope..."}
            </h2>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text)] transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* Step 1: Choose method */}
          {step === 1 && (
            <div className="space-y-4">
              {sfConfigured !== false && (
                <button
                  onClick={handleConnectSalesforce}
                  disabled={connecting || sfConfigured === null}
                  className="w-full flex items-center gap-4 p-5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg hover:border-blue-500/50 transition group text-left disabled:opacity-60"
                >
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    {connecting ? (
                      <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                    ) : (
                      <Building2 className="w-6 h-6 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold mb-1">
                      {connecting ? "Connecting to Salesforce..." : "Import from Salesforce"}
                    </div>
                    <div className="text-sm text-[var(--text-muted)]">
                      {connecting
                        ? "Complete authorization in the popup window"
                        : "Sign in with your Salesforce account to search and import"}
                    </div>
                  </div>
                  {!connecting && (
                    <LogIn className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text)] transition" />
                  )}
                </button>
              )}

              {connectError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {connectError}
                </div>
              )}

              <button
                onClick={() => setStep("blank")}
                className="w-full flex items-center gap-4 p-5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg hover:border-blue-500/50 transition group text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-1">Create Blank Scope</div>
                  <div className="text-sm text-[var(--text-muted)]">
                    Start with an empty scoping document
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text)] transition" />
              </button>
            </div>
          )}

          {/* Step blank: Blank scope name */}
          {step === "blank" && (
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">Fleet Name</label>
              <input
                type="text"
                value={blankName}
                onChange={(e) => setBlankName(e.target.value)}
                placeholder="e.g. Acme Trucking"
                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500 mb-6"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreateBlank()}
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text)] transition"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateBlank}
                  disabled={creating || !blankName.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-[var(--text)] font-medium rounded-lg transition"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Search Salesforce */}
          {step === 3 && (
            <div>
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by account name..."
                  className="w-full pl-11 pr-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500 transition"
                  autoFocus
                />
              </div>

              {searching && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                  <span className="ml-3 text-[var(--text-secondary)]">Searching Salesforce...</span>
                </div>
              )}

              {searchError && (
                <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {searchError}
                </div>
              )}

              {!searching && !searchError && query.length >= 2 && results.length === 0 && (
                <p className="text-center text-[var(--text-muted)] py-8">
                  No accounts found for &ldquo;{query}&rdquo;. Try a different search term.
                </p>
              )}

              {!searching && results.length > 0 && (
                <div className="space-y-2">
                  {results.map((acct) => (
                    <button
                      key={acct.Id}
                      onClick={() => selectAccount(acct)}
                      className="w-full flex items-center gap-3 p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg hover:border-blue-500/50 transition text-left group"
                    >
                      <Building2 className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{acct.Name}</div>
                        <div className="text-sm text-[var(--text-muted)] flex items-center gap-3">
                          {(acct.BillingCity || acct.BillingState) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {[acct.BillingCity, acct.BillingState].filter(Boolean).join(", ")}
                            </span>
                          )}
                          {acct.Industry && <span>{acct.Industry}</span>}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text)] transition" />
                    </button>
                  ))}
                </div>
              )}

              {query.length < 2 && !searching && (
                <p className="text-center text-[var(--text-muted)] py-8 text-sm">
                  Type at least 2 characters to search Salesforce accounts
                </p>
              )}
            </div>
          )}

          {/* Step 4: Preview */}
          {step === 4 && (
            <div>
              {loadingDetail && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                  <span className="ml-3 text-[var(--text-secondary)]">Loading account details...</span>
                </div>
              )}

              {detailError && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {detailError}
                  </div>
                  <button
                    onClick={() => setStep(3)}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Back to search
                  </button>
                </div>
              )}

              {!loadingDetail && !detailError && accountDetail && (
                <div className="space-y-5">
                  {/* Fleet Name */}
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">Fleet Name</label>
                    <input
                      type="text"
                      value={fleetName}
                      onChange={(e) => setFleetName(e.target.value)}
                      className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Account Details */}
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Account Details
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-[var(--text-muted)]">Location:</span>{" "}
                        <span className="text-[var(--text)]">
                          {[accountDetail.account.BillingCity, accountDetail.account.BillingState]
                            .filter(Boolean)
                            .join(", ") || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">Industry:</span>{" "}
                        <span className="text-[var(--text)]">{accountDetail.account.Industry || "N/A"}</span>
                      </div>
                      {accountDetail.account.Website && (
                        <div>
                          <span className="text-[var(--text-muted)]">Website:</span>{" "}
                          <span className="text-[var(--text)]">{accountDetail.account.Website}</span>
                        </div>
                      )}
                      {accountDetail.account.Owner?.Name && (
                        <div>
                          <span className="text-[var(--text-muted)]">Owner:</span>{" "}
                          <span className="text-[var(--text)]">{accountDetail.account.Owner.Name}</span>
                        </div>
                      )}
                      {accountDetail.account.NumberOfEmployees && (
                        <div>
                          <span className="text-[var(--text-muted)]">Employees:</span>{" "}
                          <span className="text-[var(--text)]">{accountDetail.account.NumberOfEmployees}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contacts */}
                  {accountDetail.contacts.length > 0 && (
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Contacts ({accountDetail.contacts.filter((c) => selectedContacts[c.Id]).length} of{" "}
                        {accountDetail.contacts.length} selected)
                      </h3>
                      <div className="space-y-1 max-h-60 overflow-y-auto">
                        {accountDetail.contacts.map((contact) => (
                          <button
                            key={contact.Id}
                            onClick={() => toggleContact(contact.Id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition ${
                              selectedContacts[contact.Id]
                                ? "bg-blue-500/10 border border-blue-500/20"
                                : "bg-transparent border border-transparent hover:bg-[var(--bg-card)]"
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                                selectedContacts[contact.Id]
                                  ? "bg-blue-500 border-blue-500"
                                  : "border-[var(--border)]"
                              }`}
                            >
                              {selectedContacts[contact.Id] && (
                                <Check className="w-3 h-3 text-[var(--text)]" />
                              )}
                            </div>
                            <User className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="font-medium">{contact.Name}</span>
                              {contact.Title && (
                                <span className="text-[var(--text-muted)] ml-2">- {contact.Title}</span>
                              )}
                            </div>
                            {contact.Email && (
                              <span className="text-[var(--text-muted)] text-xs truncate max-w-[180px]">
                                {contact.Email}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {accountDetail.contacts.length === 0 && (
                    <p className="text-sm text-[var(--text-muted)] text-center py-4">
                      No contacts found for this account
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Creating */}
          {step === 5 && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              <span className="ml-3 text-[var(--text-secondary)]">Creating scope document...</span>
            </div>
          )}
        </div>

        {/* Footer for Step 4 (Preview) */}
        {step === 4 && !loadingDetail && !detailError && accountDetail && (
          <div className="px-6 py-4 border-t border-[var(--border)] flex gap-3 justify-end">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text)] transition"
            >
              Back
            </button>
            <button
              onClick={() => {
                setStep(5);
                handleCreateFromSf();
              }}
              disabled={creating || !fleetName.trim()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-[var(--text)] font-medium rounded-lg transition"
            >
              Create Scope
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
