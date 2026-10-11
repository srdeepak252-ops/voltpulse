import React, { useState, useEffect } from 'react';
import { AppUser, OutageIncident, SpatialClusterResult, UserRole, CrewStatusUpdate } from './types';
import { INITIAL_INCIDENTS, INITIAL_USERS } from './data/mockData';
import { Navbar } from './components/Navbar';
import { ResidentPortal } from './components/ResidentPortal';
import { DispatcherDashboard } from './components/DispatcherDashboard';
import { DispatchCrewSection } from './components/DispatchCrewSection';
import { LoginPage } from './components/LoginPage';
import { UserManagementModal } from './components/UserManagementModal';
import { StartupScreen } from './components/StartupScreen';
import { CheckCircle2, Zap, X } from 'lucide-react';

export default function App() {
  // Startup Splash Screen State
  const [showStartupScreen, setShowStartupScreen] = useState<boolean>(true);

  // User Authentication & Directory State
  const [users, setUsers] = useState<AppUser[]>(INITIAL_USERS);
  // Starts as null so user sees the login screen right after the startup screen completes
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoginPageOpen, setIsLoginPageOpen] = useState<boolean>(false);
  const [loginInitialRole, setLoginInitialRole] = useState<UserRole>('admin');
  const [isUserManagementOpen, setIsUserManagementOpen] = useState<boolean>(false);

  // Crew Status Report Alert for Admin
  const [latestCrewAlert, setLatestCrewAlert] = useState<{
    incident: OutageIncident;
    update: CrewStatusUpdate;
  } | null>(null);

  // Global Solved Confirmation Toast for all users
  const [solvedToast, setSolvedToast] = useState<{
    code: string;
    locality: string;
    adminName: string;
    meters: number;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'resident' | 'dispatcher' | 'crew'>('resident');
  const [incidents, setIncidents] = useState<OutageIncident[]>(INITIAL_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState<OutageIncident>(INITIAL_INCIDENTS[0]);
  const [trackedTicketCode, setTrackedTicketCode] = useState<string>('OUT-8492');

  // Quota status for Google Maps Platform
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  // Live broadcast ticker message
  const [broadcastMessage, setBroadcastMessage] = useState<string>(
    'Notice: High wind alerts active in Sector 4. Utility crews are on standby.'
  );

  // SCADA Ingestion Simulation Trigger
  const handleSimulateScadaEvent = () => {
    const scadaCode = `OUT-SCADA-${Math.floor(100 + Math.random() * 900)}`;
    const newIncident: OutageIncident = {
      id: `inc-scada-${Date.now()}`,
      code: scadaCode,
      substation: 'BESCOM Malleshwaram 66/11kV Substation - Feeder M-02',
      locality: 'Malleshwaram 8th Cross & Margosa Road, Bengaluru',
      severity: 'HIGH',
      status: 'TRIAGED',
      affectedMeters: 620,
      criticalFacilities: ['KC General Hospital Malleshwaram (Backup Power)'],
      reportedAt: 'Just now (Automated Telemetry)',
      etr: 'In 1h 30m',
      crewAssigned: null,
      lat: 13.0035,
      lng: 77.5701,
      hazardReported: false,
      causeCategory: 'SCADA_BREAKER_TRIP',
    };

    setIncidents((prev) => [newIncident, ...prev]);
    setSelectedIncident(newIncident);
    setBroadcastMessage(
      `SCADA Alert: Automatic breaker trip detected on Malleshwaram Feeder M-02. 620 meters cut.`
    );
  };

  const handleNewReport = (
    updatedIncidents: OutageIncident[],
    clusterResult: SpatialClusterResult
  ) => {
    setIncidents(updatedIncidents);
    setSelectedIncident(clusterResult.incident);
    setTrackedTicketCode(clusterResult.incident.code);
  };

  // Assign or update a username on a citizen-reported issue
  const handleAssignUsername = (
    incidentId: string,
    reportId: string,
    newUsername: string,
    updatedResidentName?: string
  ) => {
    const cleanUsername = newUsername.replace(/^@/, '').trim();

    // 1. Update incidents list
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id !== incidentId) return inc;
        const updatedReports = (inc.customerReports || []).map((rep) => {
          if (rep.id === reportId) {
            return {
              ...rep,
              username: cleanUsername,
              ...(updatedResidentName ? { residentName: updatedResidentName } : {}),
            };
          }
          return rep;
        });
        return {
          ...inc,
          customerReports: updatedReports,
        };
      })
    );

    // 2. Update selected incident if matched
    setSelectedIncident((prev) => {
      if (prev.id !== incidentId) return prev;
      const updatedReports = (prev.customerReports || []).map((rep) => {
        if (rep.id === reportId) {
          return {
            ...rep,
            username: cleanUsername,
            ...(updatedResidentName ? { residentName: updatedResidentName } : {}),
          };
        }
        return rep;
      });
      return {
        ...prev,
        customerReports: updatedReports,
      };
    });

    // 3. Sync into the users registry if existing or create an entry
    setUsers((prev) => {
      const existing = prev.find(
        (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
      );
      if (existing) {
        return prev.map((u) =>
          u.id === existing.id
            ? {
                ...u,
                ...(updatedResidentName ? { fullName: updatedResidentName } : {}),
                assignedIssuesCount: (u.assignedIssuesCount || 0) + 1,
              }
            : u
        );
      }
      return prev;
    });
  };

  // Update user in directory (from UserManagementModal)
  const handleUpdateUser = (updatedUser: AppUser) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }

    // Propagate username/name updates to all citizen reports across all incidents
    setIncidents((prev) =>
      prev.map((inc) => {
        if (!inc.customerReports) return inc;
        let modified = false;
        const updatedReports = inc.customerReports.map((rep) => {
          if (rep.userId === updatedUser.id || rep.username === updatedUser.username) {
            modified = true;
            return {
              ...rep,
              username: updatedUser.username,
              residentName: updatedUser.fullName,
            };
          }
          return rep;
        });
        return modified ? { ...inc, customerReports: updatedReports } : inc;
      })
    );
  };

  // Add new user to directory (from UserManagementModal)
  const handleAddUser = (newUser: AppUser) => {
    setUsers((prev) => [newUser, ...prev]);
  };

  // Handle Crew Status Update submitted to Admin
  const handleCrewStatusUpdate = (incidentId: string, update: CrewStatusUpdate) => {
    let targetIncidentSnapshot: OutageIncident | null = null;

    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id !== incidentId) return inc;
        const existingUpdates = inc.crewStatusUpdates || [];
        const newStatus =
          update.fieldStatus === 'READY_FOR_ENERGIZATION'
            ? inc.status
            : update.fieldStatus === 'EN_ROUTE'
            ? ('CREW_DISPATCHED' as const)
            : ('IN_PROGRESS' as const);

        const updatedInc: OutageIncident = {
          ...inc,
          status: inc.status === 'RESTORED' ? 'RESTORED' : newStatus,
          latestCrewStatus: update.fieldStatus,
          hazardReported: update.hazardCleared ? false : inc.hazardReported,
          crewAssigned: update.crewName || inc.crewAssigned,
          etr: update.estimatedMinutesRemaining ? `In ${update.estimatedMinutesRemaining} mins` : inc.etr,
          crewStatusUpdates: [update, ...existingUpdates],
        };
        targetIncidentSnapshot = updatedInc;
        return updatedInc;
      })
    );

    setSelectedIncident((prev) => {
      if (prev.id !== incidentId) return prev;
      const existingUpdates = prev.crewStatusUpdates || [];
      return {
        ...prev,
        latestCrewStatus: update.fieldStatus,
        hazardReported: update.hazardCleared ? false : prev.hazardReported,
        crewAssigned: update.crewName || prev.crewAssigned,
        etr: update.estimatedMinutesRemaining ? `In ${update.estimatedMinutesRemaining} mins` : prev.etr,
        crewStatusUpdates: [update, ...existingUpdates],
      };
    });

    // Alert Admin immediately of the crew's reported situation
    const alertTarget = targetIncidentSnapshot || incidents.find((i) => i.id === incidentId);
    if (alertTarget) {
      setLatestCrewAlert({
        incident: { ...alertTarget, latestCrewStatus: update.fieldStatus },
        update,
      });
    }
  };

  // Handle Admin Mark Problem Solved & Update Everyone
  const handleMarkProblemSolved = (
    incidentId: string,
    resolutionNotes: string,
    broadcastText: string
  ) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today';
    const adminName = currentUser?.fullName || 'Senior Grid Controller';

    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id !== incidentId) return inc;
        return {
          ...inc,
          status: 'RESTORED',
          etr: 'Grid Energized & Closed',
          hazardReported: false,
          resolvedAt: nowStr,
          resolvedByAdmin: adminName,
          resolutionNotes,
          latestCrewStatus: 'READY_FOR_ENERGIZATION',
        };
      })
    );

    setSelectedIncident((prev) => {
      if (prev.id !== incidentId) return prev;
      return {
        ...prev,
        status: 'RESTORED',
        etr: 'Grid Energized & Closed',
        hazardReported: false,
        resolvedAt: nowStr,
        resolvedByAdmin: adminName,
        resolutionNotes,
        latestCrewStatus: 'READY_FOR_ENERGIZATION',
      };
    });

    const found = incidents.find((i) => i.id === incidentId);

    // Broadcast update across the grid network
    if (broadcastText && broadcastText.trim()) {
      setBroadcastMessage(broadcastText.trim());
    } else if (found) {
      setBroadcastMessage(
        `✅ Grid Restored: ${found.locality} has been fully energized and verified by Admin.`
      );
    }

    // Trigger universal solved confirmation toast
    if (found) {
      setSolvedToast({
        code: found.code,
        locality: found.locality,
        adminName,
        meters: found.affectedMeters,
      });
      setTimeout(() => setSolvedToast(null), 6500);
    }

    // Dismiss active crew alert if it matches this resolved incident
    if (latestCrewAlert?.incident.id === incidentId) {
      setLatestCrewAlert(null);
    }
  };

  // Handle successful login
  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    setIsLoginPageOpen(false);
    // Direct users to relevant portal based on role
    if (user.role === 'admin') {
      setActiveTab('dispatcher');
    } else if (user.role === 'crew') {
      setActiveTab('crew');
    } else {
      setActiveTab('resident');
    }
  };

  // Handle logout
  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoginPageOpen(true);
  };

  // STARTUP SPLASH SCREEN WITH APP LOGO (Renders first on app load)
  if (showStartupScreen) {
    return <StartupScreen onComplete={() => setShowStartupScreen(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* GOOGLE MAPS PLATFORM QUOTA BANNER */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* NAVIGATION BAR & EMERGENCY ADVISORY */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'dispatcher' && currentUser?.role !== 'admin') {
            setLoginInitialRole('admin');
            setIsLoginPageOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        broadcastMessage={broadcastMessage}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenLogin={(role) => {
          setLoginInitialRole(role || 'user');
          setIsLoginPageOpen(true);
        }}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        openProblemsCount={incidents.filter((i) => i.status !== 'RESTORED').length}
        onReplayStartup={() => setShowStartupScreen(true)}
      />

      {/* MAIN VIEW CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {isLoginPageOpen || !currentUser ? (
          <LoginPage
            users={users}
            onLogin={handleLogin}
            initialRole={loginInitialRole}
            onCancel={currentUser ? () => setIsLoginPageOpen(false) : undefined}
          />
        ) : activeTab === 'resident' ? (
          <ResidentPortal
            incidents={incidents}
            onNewReport={handleNewReport}
            trackedTicketCode={trackedTicketCode}
            currentUser={currentUser}
            onSelectTrackedTicket={(code) => {
              setTrackedTicketCode(code);
              const found = incidents.find((i) => i.code === code);
              if (found) setSelectedIncident(found);
            }}
          />
        ) : activeTab === 'crew' ? (
          <DispatchCrewSection
            incidents={incidents}
            selectedIncident={selectedIncident}
            setSelectedIncident={setSelectedIncident}
            onUpdateIncident={(updated) => {
              setIncidents((prev) =>
                prev.map((i) => (i.id === updated.id ? updated : i))
              );
              setSelectedIncident(updated);
            }}
            onCrewStatusUpdate={handleCrewStatusUpdate}
            onMarkProblemSolved={handleMarkProblemSolved}
            currentUser={currentUser}
            onSwitchToAdmin={() => {
              const adminUser = users.find((u) => u.role === 'admin') || users[0];
              setCurrentUser(adminUser);
            }}
          />
        ) : (
          <DispatcherDashboard
            incidents={incidents}
            selectedIncident={selectedIncident}
            setSelectedIncident={setSelectedIncident}
            onUpdateIncident={(updated) => {
              setIncidents((prev) =>
                prev.map((i) => (i.id === updated.id ? updated : i))
              );
              setSelectedIncident(updated);
            }}
            onBroadcastUpdate={(msg) => setBroadcastMessage(msg)}
            onSimulateScadaEvent={handleSimulateScadaEvent}
            users={users}
            onAssignUsername={handleAssignUsername}
            onOpenUserDirectory={() => setIsUserManagementOpen(true)}
            onMarkProblemSolved={handleMarkProblemSolved}
            onOpenCrewSection={() => setActiveTab('crew')}
            currentUser={currentUser}
            latestCrewAlert={latestCrewAlert}
            onDismissCrewAlert={() => setLatestCrewAlert(null)}
          />
        )}
      </main>

      {/* UNIVERSAL PROBLEM RESTORED NOTIFICATION */}
      {solvedToast && (
        <div
          id="solved-global-toast"
          className="fixed bottom-12 right-4 sm:right-6 z-50 max-w-sm sm:max-w-md w-full bg-slate-900/95 border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300 flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Grid Problem Solved
              </span>
              <span className="font-mono text-xs font-bold text-cyan-400">{solvedToast.code}</span>
            </div>
            <h4 className="text-xs font-bold text-white mt-1">
              Power Restored: {solvedToast.locality}
            </h4>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              {solvedToast.meters.toLocaleString()} meters re-energized. Verified by {solvedToast.adminName}. Broadcast notification sent to everyone.
            </p>
          </div>
          <button
            onClick={() => setSolvedToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* USER MANAGEMENT & DIRECTORY MODAL */}
      {isUserManagementOpen && (
        <UserManagementModal
          users={users}
          onClose={() => setIsUserManagementOpen(false)}
          onUpdateUser={handleUpdateUser}
          onAddUser={handleAddUser}
        />
      )}

      {/* FOOTER */}
      <footer className="h-9 bg-[#070A12] border-t border-slate-800 flex flex-wrap items-center px-4 sm:px-6 justify-between flex-shrink-0 text-[10px] text-slate-500 gap-2">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-amber-500 mr-2 animate-pulse" />
            <span>LIVE TELEMETRY: 254 pkts/sec</span>
          </div>
          <span className="h-3 w-px bg-slate-800 hidden xs:inline-block" />
          <div className="hidden xs:inline-block">GIS: 12.9716° N, 77.5946° E (BENGALURU BESCOM GRID)</div>
        </div>
        <div className="font-mono text-slate-600 uppercase tracking-widest text-[10px]">
          VoltPulse Infrastructure Node 0x98A1
        </div>
      </footer>
    </div>
  );
}
