/**
 * Security Dashboard
 * 
 * Monitor and manage security events, locked accounts, and blocked IPs
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Ban, Activity, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

export default function SecurityDashboard() {
  const [selectedTab, setSelectedTab] = useState<"overview" | "locked" | "blocked" | "events">("overview");

  // Fetch security data
  const { data: config } = useQuery({
    queryKey: ["security", "config"],
    queryFn: () => client.security.getConfig.query(),
  });

  const { data: stats } = useQuery({
    queryKey: ["security", "stats"],
    queryFn: () => client.security.getStats.query(),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: lockedAccounts, refetch: refetchLocked } = useQuery({
    queryKey: ["security", "locked"],
    queryFn: () => client.security.getLockedAccounts.query(),
    refetchInterval: 5000,
  });

  const { data: blockedIPs, refetch: refetchBlocked } = useQuery({
    queryKey: ["security", "blocked"],
    queryFn: () => client.security.getBlockedIPs.query(),
    refetchInterval: 5000,
  });

  const { data: recentEvents } = useQuery({
    queryKey: ["security", "events"],
    queryFn: () => client.security.getRecentEvents.query({ limit: 50 }),
    refetchInterval: 5000,
  });

  // Mutations
  const unlockMutation = useMutation({
    mutationFn: (username: string) => client.security.unlockAccount.mutate({ username }),
    onSuccess: () => refetchLocked(),
  });

  const unblockMutation = useMutation({
    mutationFn: (ip: string) => client.security.unblockIP.mutate({ ip }),
    onSuccess: () => refetchBlocked(),
  });

  const isEnabled = config?.enabled ?? false;
  const environment = config?.environment ?? "development";

  return (
    <div className="container mx-auto p-6 space-y-6" dir="ltr">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Security Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage security events
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={environment === "production" ? "destructive" : "secondary"}>
            {environment.toUpperCase()}
          </Badge>
          <Badge variant={isEnabled ? "default" : "outline"}>
            {isEnabled ? "Security Enabled" : "Security Disabled"}
          </Badge>
        </div>
      </div>

      {/* Warning for disabled security */}
      {!isEnabled && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="w-5 h-5" />
              Security Disabled (Development Mode)
            </CardTitle>
            <CardDescription>
              Security features are disabled in development for fast and easy access.
              They will be automatically enabled in production.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events (24h)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.logger.last24h ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.logger.total ?? 0} total events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locked Accounts</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.store.lockedAccounts ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently locked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.store.blockedIPs ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently blocked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Login Attempts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.store.totalLoginAttempts ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Total recorded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={selectedTab === "overview" ? "default" : "ghost"}
          onClick={() => setSelectedTab("overview")}
        >
          Overview
        </Button>
        <Button
          variant={selectedTab === "locked" ? "default" : "ghost"}
          onClick={() => setSelectedTab("locked")}
        >
          Locked Accounts ({lockedAccounts?.length ?? 0})
        </Button>
        <Button
          variant={selectedTab === "blocked" ? "default" : "ghost"}
          onClick={() => setSelectedTab("blocked")}
        >
          Blocked IPs ({blockedIPs?.length ?? 0})
        </Button>
        <Button
          variant={selectedTab === "events" ? "default" : "ghost"}
          onClick={() => setSelectedTab("events")}
        >
          Recent Events
        </Button>
      </div>

      {/* Tab Content */}
      {selectedTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Event Types */}
          <Card>
            <CardHeader>
              <CardTitle>Events by Type (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats?.logger.byType && Object.entries(stats.logger.byType).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm">{type.replace(/_/g, " ")}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Event Severity */}
          <Card>
            <CardHeader>
              <CardTitle>Events by Severity (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats?.logger.bySeverity && Object.entries(stats.logger.bySeverity).map(([severity, count]) => (
                  <div key={severity} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{severity}</span>
                    <Badge 
                      variant={
                        severity === "critical" ? "destructive" :
                        severity === "high" ? "destructive" :
                        severity === "medium" ? "default" : "outline"
                      }
                    >
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top IPs */}
          <Card>
            <CardHeader>
              <CardTitle>Top IPs (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats?.logger.topIPs && stats.logger.topIPs.map((item: any) => (
                  <div key={item.ip} className="flex justify-between items-center">
                    <span className="text-sm font-mono">{item.ip}</span>
                    <Badge variant="outline">{item.count} events</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Users */}
          <Card>
            <CardHeader>
              <CardTitle>Top Users (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats?.logger.topUsers && stats.logger.topUsers.map((item: any) => (
                  <div key={item.username} className="flex justify-between items-center">
                    <span className="text-sm">{item.username}</span>
                    <Badge variant="outline">{item.count} events</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === "locked" && (
        <Card>
          <CardHeader>
            <CardTitle>Locked Accounts</CardTitle>
            <CardDescription>Accounts that are currently locked due to failed login attempts</CardDescription>
          </CardHeader>
          <CardContent>
            {lockedAccounts && lockedAccounts.length > 0 ? (
              <div className="space-y-4">
                {lockedAccounts.map((account: any) => (
                  <div key={account.username} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{account.username}</p>
                      <p className="text-sm text-muted-foreground">{account.reason}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Locked at: {new Date(account.lockedAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires at: {new Date(account.expiresAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unlockMutation.mutate(account.username)}
                      disabled={unlockMutation.isPending}
                    >
                      Unlock
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No locked accounts</p>
            )}
          </CardContent>
        </Card>
      )}

      {selectedTab === "blocked" && (
        <Card>
          <CardHeader>
            <CardTitle>Blocked IP Addresses</CardTitle>
            <CardDescription>IP addresses that are currently blocked</CardDescription>
          </CardHeader>
          <CardContent>
            {blockedIPs && blockedIPs.length > 0 ? (
              <div className="space-y-4">
                {blockedIPs.map((block: any) => (
                  <div key={block.ip} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium font-mono">{block.ip}</p>
                      <p className="text-sm text-muted-foreground">{block.reason}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Blocked at: {new Date(block.blockedAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires at: {new Date(block.expiresAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unblockMutation.mutate(block.ip)}
                      disabled={unblockMutation.isPending}
                    >
                      Unblock
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No blocked IPs</p>
            )}
          </CardContent>
        </Card>
      )}

      {selectedTab === "events" && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Security Events</CardTitle>
            <CardDescription>Last 50 security events</CardDescription>
          </CardHeader>
          <CardContent>
            {recentEvents && recentEvents.length > 0 ? (
              <div className="space-y-2">
                {recentEvents.map((event: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="mt-1">
                      {event.severity === "critical" && <XCircle className="w-5 h-5 text-red-500" />}
                      {event.severity === "high" && <AlertTriangle className="w-5 h-5 text-orange-500" />}
                      {event.severity === "medium" && <Activity className="w-5 h-5 text-yellow-500" />}
                      {event.severity === "low" && <CheckCircle className="w-5 h-5 text-green-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{event.type.replace(/_/g, " ")}</span>
                        <Badge variant="outline" className="text-xs">{event.severity}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {event.username && <span>User: {event.username}</span>}
                        {event.ip && <span className="ml-3 font-mono">{event.ip}</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No recent events</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
