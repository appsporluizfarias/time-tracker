"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Key, Plus, Trash2, Copy, Check, Eye, EyeOff } from "lucide-react";

interface Token {
  id: string;
  name: string;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

interface SettingsClientProps {
  user: { id: string; name: string; email: string };
  tokens: Token[];
}

export function SettingsClient({ user, tokens: initialTokens }: SettingsClientProps) {
  const router = useRouter();
  const [tokens, setTokens] = useState(initialTokens);
  const [newTokenName, setNewTokenName] = useState("");
  const [newTokenValue, setNewTokenValue] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    email: user.email,
    password: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  async function createToken() {
    if (!newTokenName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTokenName }),
    });
    const data = await res.json();
    setNewTokenValue(data.token);
    setNewTokenName("");
    setCreating(false);
    router.refresh();
    const res2 = await fetch("/api/tokens");
    const tokensList = await res2.json();
    setTokens(tokensList);
  }

  async function revokeToken(id: string) {
    if (!confirm("Revoke this token? It cannot be undone.")) return;
    await fetch(`/api/tokens/${id}/revoke`, { method: "POST" });
    router.refresh();
    const res = await fetch("/api/tokens");
    const tokensList = await res.json();
    setTokens(tokensList);
  }

  async function copyToken() {
    if (!newTokenValue) return;
    await navigator.clipboard.writeText(newTokenValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    const body: Record<string, string> = { name: profileForm.name, email: profileForm.email };
    if (profileForm.password) body.password = profileForm.password;
    await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSavingProfile(false);
    setProfileSaved(true);
    setProfileForm({ ...profileForm, password: "" });
    setTimeout(() => setProfileSaved(false), 3000);
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Profile
        </h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>New Password (leave blank to keep current)</Label>
            <Input
              type="password"
              value={profileForm.password}
              onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          {profileSaved && (
            <p className="text-sm text-green-600 dark:text-green-400">Profile saved!</p>
          )}
          <Button type="submit" disabled={savingProfile}>
            {savingProfile ? "Saving…" : "Save Profile"}
          </Button>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2 mb-4">
          <Key className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            API Tokens
          </h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Use API tokens to authenticate requests to the REST API. Tokens are shown once at creation.
        </p>

        {newTokenValue && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
              Save your token now — it won&apos;t be shown again.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-white px-3 py-2 text-sm font-mono text-gray-900 dark:bg-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
                {showToken ? newTokenValue : "•".repeat(32)}
              </code>
              <button
                onClick={() => setShowToken(!showToken)}
                className="rounded p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                onClick={copyToken}
                className="rounded p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}

        <div className="mb-4 flex gap-2">
          <Input
            value={newTokenName}
            onChange={(e) => setNewTokenName(e.target.value)}
            placeholder="Token name (e.g. CI/CD, Jira)"
            onKeyDown={(e) => e.key === "Enter" && createToken()}
          />
          <Button onClick={createToken} disabled={creating || !newTokenName.trim()}>
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        </div>

        {tokens.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No tokens yet.</p>
        ) : (
          <div className="space-y-2">
            {tokens.map((token) => (
              <div
                key={token.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {token.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Created {format(new Date(token.createdAt), "MMM d, yyyy")}
                    {token.lastUsedAt &&
                      ` · Last used ${format(new Date(token.lastUsedAt), "MMM d, yyyy")}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {token.revokedAt ? (
                    <Badge variant="destructive">Revoked</Badge>
                  ) : (
                    <>
                      <Badge variant="success">Active</Badge>
                      <button
                        onClick={() => revokeToken(token.id)}
                        className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
