<div align="center">

```
██╗  ██╗ ██████╗ ███████╗████████╗███████╗██╗     ██╗  ██╗██╗   ██╗██████╗
██║  ██║██╔═══██╗██╔════╝╚══██╔══╝██╔════╝██║     ██║  ██║██║   ██║██╔══██╗
███████║██║   ██║███████╗   ██║   █████╗  ██║     ███████║██║   ██║██████╔╝
██╔══██║██║   ██║╚════██║   ██║   ██╔══╝  ██║     ██╔══██║██║   ██║██╔══██╗
██║  ██║╚██████╔╝███████║   ██║   ███████╗███████╗██║  ██║╚██████╔╝██████╔╝
╚═╝  ╚═╝ ╚═════╝ ╚══════╝   ╚═╝   ╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝
```

### 🏠 *Hostel complaints — every one on the clock. Zero ignored.*

<br/>

![Version](https://img.shields.io/badge/version-1.0.0-14b8a6?style=for-the-badge)
![Stack](https://img.shields.io/badge/stack-MERN-14b8a6?style=for-the-badge&logo=mongodb&logoColor=black)
![SLA Engine](https://img.shields.io/badge/SLA%20Engine-Live-14b8a6?style=for-the-badge)
![Roles](https://img.shields.io/badge/roles-Student%20%7C%20Warden%20%7C%20Admin-0d9488?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-14b8a6?style=for-the-badge)

<br/>

> **"A hostel complaint without an SLA is just a wish. HostelHub gives every one a deadline."**

</div>

---

## 🏠 What is HostelHub?

**HostelHub** is a full-stack MERN hostel maintenance ticket management system with a built-in **SLA (Service Level Agreement) engine**. Every complaint submitted by a student is automatically assigned a resolution deadline based on priority — and a cron job escalates breaches directly to the warden.

No more "I submitted but nothing happened". HostelHub makes accountability visible to everyone.

---

## ✨ Features

| 🏷️ Feature | 📋 Description |
|---|---|
| 🎫 **Ticket Submission** | Students submit complaints with title, category, priority, room number |
| ⏱️ **SLA Timers** | High = 8h, Medium = 24h, Low = 72h — auto-calculated from assignment |
| ⚡ **Auto-Escalation** | Cron job (every 5 min) escalates approaching/breached SLAs to warden |
| 📋 **Status Timeline** | Created → Assigned → In Progress → Resolved (or Reopened) — full audit trail |
| 🔔 **Notifications** | Real-time alerts for status changes and escalations |
| 👨‍💼 **Warden Kanban** | Board view: Open / Assigned / In Progress / Resolved columns |
| 🔄 **Reopen Window** | 72h reopen window after resolution — students can push back |
| 📊 **SLA Dashboard** | Live SLA health: healthy / warning / escalated counts |

---

## 🗺️ HostelHub Mindmap

```mermaid
mindmap
  root((🏠 HostelHub))
    Student
      Submit Ticket
        Title
        Category
          Electrical
          Plumbing
          WiFi
          Cleaning
          Other
        Priority High/Med/Low
        Room Number
        Description
      Track My Tickets
        Status Timeline
        SLA Countdown
        Reopen if Needed
      Notifications
        Status Updates
        Resolution Alerts
    Warden
      View All Tickets
      Assign Tickets
      Update Status
      Kanban Board
      SLA Dashboard
      Escalation Alerts
    Admin
      Manage Users
      System Config
      Reports
    SLA Engine
      Priority Based SLA
        High 8h
        Medium 24h
        Low 72h
      Cron Every 5min
        Warn Approaching
        Escalate Breach
      Notification Triggers
```

---

## ⏱️ SLA Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Open: 🎫 Ticket Submitted
    Open --> Assigned: 👨‍💼 Warden Assigns
    Assigned --> InProgress: 🔧 Work Started
    InProgress --> Resolved: ✅ Fixed

    Open --> Escalated: ⏰ SLA Breach (cron)
    Assigned --> Escalated: ⏰ SLA Breach (cron)
    Escalated --> Resolved: ✅ Fixed after escalation

    Resolved --> Reopened: 🔄 Student reopens (within 72h)
    Reopened --> InProgress: 🔧 Reassigned

    Resolved --> Closed: ⏱️ 72h window expired
    Closed --> [*]: 🗄️ Archived

    note right of Escalated
        Auto-triggered by
        cron every 5 minutes
        Notifies warden immediately
    end note
```

---

## ⚙️ SLA Engine Flow

```mermaid
flowchart TD
    CRON[⏰ Cron Job\nEvery 5 minutes] --> SCAN[🔍 Scan All Open Tickets]
    SCAN --> CHECK{Check SLA Status}
    CHECK -->|Healthy| SKIP[✅ Skip — All Good]
    CHECK -->|< 1h Remaining| WARN[⚡ Warn Warden]
    CHECK -->|Deadline Passed| ESC[🚨 Auto-Escalate]
    ESC --> NOTIF[🔔 Push Notification to Warden]
    NOTIF --> STATUS[📋 Update ticket.status = escalated]
    WARN --> NOTIF2[📧 SLA Warning Notification]

    style CRON fill:#070d18,color:#14b8a6,stroke:#14b8a6
    style ESC fill:#070d18,color:#ef4444,stroke:#ef4444
    style NOTIF fill:#070d18,color:#14b8a6,stroke:#14b8a6
```

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph FE["🖥️ Frontend (port 5305)"]
        LS[Landing]
        TS[Tickets List]
        TD[Ticket Detail + Timeline]
        KB[Warden Kanban]
        NB[Notification Bell]
    end
    subgraph BE["⚙️ Backend (port 5105)"]
        API[Express /api]
        TR[/tickets]
        NR[/notifications]
        CRON[⏰ SLA Cron Engine]
        UR[/users]
    end
    subgraph DB["🍃 MongoDB"]
        TK[(Tickets)]
        NT[(Notifications)]
        TL[(Timeline Events)]
        US[(Users)]
    end

    FE -->|Axios + JWT| BE
    CRON -->|Every 5min| TK
    CRON --> NT
    TR --> TK
    TR --> TL
    NR --> NT

    style FE fill:#070d18,color:#14b8a6,stroke:#14b8a6
    style CRON fill:#050c15,color:#ef4444,stroke:#ef4444
    style BE fill:#050c15,color:#14b8a6,stroke:#14b8a6
    style DB fill:#030810,color:#14b8a6,stroke:#14b8a6
```

---

## 📊 Data Model

```mermaid
erDiagram
    USER {
        string id PK
        string name
        string email
        string role "student|warden|admin"
        string roomNumber
        string passwordHash
    }
    TICKET {
        string id PK
        string studentId FK
        string assignedTo FK
        string title
        string category
        string priority "high|medium|low"
        string status
        date slaDeadline
        boolean escalated
        date createdAt
    }
    TIMELINE_EVENT {
        string id PK
        string ticketId FK
        string actorId FK
        string action
        string note
        date timestamp
    }
    NOTIFICATION {
        string id PK
        string userId FK
        string ticketId FK
        string type
        boolean read
        date createdAt
    }

    USER ||--o{ TICKET : "submits"
    USER ||--o{ TICKET : "assigned"
    TICKET ||--o{ TIMELINE_EVENT : "has"
    USER ||--o{ NOTIFICATION : "receives"
```

---

## 🎨 Design Identity

```
┌─────────────────────────────────────────────────────────────┐
│                    HOSTELHUB PALETTE                        │
├──────────────┬──────────────┬──────────────┬───────────────┤
│  Console Dark│  Teal Bright │  Danger Red  │  Warn Amber   │
│  #070d18     │  #14b8a6     │  #ef4444     │  #f59e0b      │
│  ████████    │  ████████    │  ████████    │  ████████     │
├──────────────┴──────────────┴──────────────┴───────────────┤
│  Typography: Manrope (Display) + IBM Plex Mono (Code/Data)  │
│  Aesthetic: Terminal console · SLA spine colors · dark ops  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

```bash
cd hostelhub/backend && cp .env.example .env && npm install && npm run dev
cd hostelhub/frontend && npm install && npm run dev
open http://localhost:5305
```

### 🎭 Demo Accounts
| Role | Email | Password | Access |
|------|-------|----------|--------|
| 🎓 Student | `dev@demo.com` | `Demo@1234` | Submit & track tickets |
| 🔑 Warden | `warden@demo.com` | `Demo@1234` | Full kanban + assign |
| ⚙️ Admin | `admin@demo.com` | `Demo@1234` | System settings |

---

<div align="center">

### 🏠 Every complaint has a deadline. Every deadline has a consequence.

![SLA](https://img.shields.io/badge/SLA-Auto%20Enforced-14b8a6?style=for-the-badge)
![Escalation](https://img.shields.io/badge/Auto-Escalation-ef4444?style=for-the-badge)

</div>
