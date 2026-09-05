import React, { useState } from 'react';
import { AppUser, OutageIncident, SpatialClusterResult, UserRole } from './types';
import { INITIAL_INCIDENTS, INITIAL_USERS } from './data/mockData';
import { Navbar } from './components/Navbar';
import { ResidentPortal } from './components/ResidentPortal';
import { DispatcherDashboard } from './components/DispatcherDashboard';
import { LoginPage } from './components/LoginPage';
import { UserManagementModal } from './components/UserManagementModal';
import { StartupPage } from './components/StartupPage';
import { ReportOutageModal } from './components/ReportOutageModal';

export default function App() {
  // User Authentication & Directory State
  const [users, setUsers] = useState<AppUser[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(INITIAL_USERS[0]); // Starts as John Doe (admin)
  const [isLoginPageOpen, setIsLoginPageOpen] = useState<boolean>(false);
  const [loginInitialRole, setLoginInitialRole] = useState<UserRole>('user');
  const [isUserManagementOpen, setIsUserManagementOpen] = useState<boolean>(false);
  const [isStartupReportModalOpen, setIsStartupReportModalOpen] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'start' | 'resident' | 'dispatcher'>('start');
  const [incidents, setIncidents] = useState<OutageIncident[]>(INITIAL_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState<OutageIncident>(INITIAL_INCIDENTS[0]);
  const [trackedTicketCode, setTrackedTicketCode] = useState<string>('OUT-8492');

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

  // Handle successful login
  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    setIsLoginPageOpen(false);
    // Direct admins to the dispatcher dashboard, citizens to resident portal
    if (user.role === 'admin') {
      setActiveTab('dispatcher');
    } else {
      setActiveTab('resident');
    }
  };

  // Handle logout
  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoginPageOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans flex flex-col selection:bg-cyan-500 selection:text-black">
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
        ) : activeTab === 'start' ? (
          <StartupPage
            incidents={incidents}
            currentUser={currentUser}
            users={users}
            onSelectRole={(role) => {
              if (role === 'dispatcher' && currentUser?.role !== 'admin') {
                setLoginInitialRole('admin');
                setIsLoginPageOpen(true);
              } else {
                setActiveTab(role);
              }
            }}
            onOpenReportModal={() => setIsStartupReportModalOpen(true)}
            onTrackTicket={(ticketCode) => {
              setTrackedTicketCode(ticketCode);
              const found = incidents.find(
                (i) => i.code.toUpperCase() === ticketCode.toUpperCase()
              );
              if (found) setSelectedIncident(found);
              setActiveTab('resident');
            }}
            onSwitchUser={(user) => {
              setCurrentUser(user);
            }}
            onSimulateScada={handleSimulateScadaEvent}
            onOpenUserDirectory={() => setIsUserManagementOpen(true)}
            onOpenLogin={(role) => {
              setLoginInitialRole(role || 'user');
              setIsLoginPageOpen(true);
            }}
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
          />
        )}
      </main>

      {/* STARTUP OUTAGE REPORT MODAL */}
      {isStartupReportModalOpen && (
        <ReportOutageModal
          incidents={incidents}
          currentUser={currentUser}
          onClose={() => setIsStartupReportModalOpen(false)}
          onSubmitReport={(updatedIncidents, clusterResult) => {
            handleNewReport(updatedIncidents, clusterResult);
            setIsStartupReportModalOpen(false);
            setActiveTab('resident');
          }}
        />
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
