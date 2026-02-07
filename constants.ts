import { User, UserRole, Meeting, MeetingStatus, ActionStatus, VoteType, RepositoryDoc } from './types';

export const MOCK_USERS: User[] = [
  { 
    id: 'u1', 
    name: 'Thabo Mbeki (Chair)', 
    role: UserRole.CHAIRPERSON, 
    avatar: 'https://ui-avatars.com/api/?name=Thabo+Mbeki&background=0D8ABC&color=fff', 
    initials: 'TM',
    status: 'ACTIVE',
    approvals: [],
    email: 'chair@boardwise.co.za'
  },
  { 
    id: 'u2', 
    name: 'Sarah Van Der Merwe', 
    role: UserRole.EXECUTIVE, 
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Van+Der+Merwe&background=random', 
    initials: 'SV',
    status: 'ACTIVE',
    approvals: [],
    email: 'ceo@boardwise.co.za'
  },
  { 
    id: 'u3', 
    name: 'Sipho Nkosi', 
    role: UserRole.NON_EXECUTIVE, 
    avatar: 'https://ui-avatars.com/api/?name=Sipho+Nkosi&background=random', 
    initials: 'SN',
    status: 'ACTIVE',
    approvals: [],
    email: 'sipho@boardwise.co.za'
  },
  { 
    id: 'u4', 
    name: 'Priya Patel', 
    role: UserRole.SECRETARY, 
    avatar: 'https://ui-avatars.com/api/?name=Priya+Patel&background=random', 
    initials: 'PP',
    status: 'ACTIVE',
    approvals: [],
    email: 'sec@boardwise.co.za'
  },
  // Pending User for Demo
  {
    id: 'u_pending_1',
    name: 'James Mwangi',
    role: UserRole.NON_EXECUTIVE,
    avatar: 'https://ui-avatars.com/api/?name=James+Mwangi&background=random',
    initials: 'JM',
    status: 'PENDING_APPROVAL',
    approvals: ['u1'], // Already approved by Chair, needs 1 more
    documents: {
      certifiedId: true,
      proofOfResidence: true,
      cv: true
    },
    email: 'james.m@boardwise.co.za'
  }
];

export const MOCK_ACTIONS: any[] = [
  { id: 'a1', task: 'Review B-BBEE Level 1 Strategy', owner: 'Sarah Van Der Merwe', deadline: '2024-06-15', status: ActionStatus.IN_PROGRESS, source: 'Meeting', lastUpdate: 'Draft circulated for comment.' },
  { id: 'a2', task: 'Finalize SENS Announcement regarding acquisition', owner: 'Sipho Nkosi', deadline: '2024-05-20', status: ActionStatus.PENDING, source: 'Meeting', lastUpdate: 'Awaiting initial draft.' },
  { id: 'a3', task: 'Update Social & Ethics Charter', owner: 'Priya Patel', deadline: '2024-07-01', status: ActionStatus.PENDING, source: 'Email', lastUpdate: 'Pending legal review.' },
];

export const INITIAL_MEETINGS: Meeting[] = [
  {
    id: 'm1',
    title: 'Q2 Board Meeting',
    date: '2024-05-24T10:00:00',
    status: MeetingStatus.LIVE,
    location: 'Sandton HQ / Online',
    complianceScore: 85,
    agenda: [
      { id: 'ag1', title: 'Welcome & Declaration of Interests', presenter: 'Chairperson', durationMinutes: 10, isComplianceCheck: true, documents: ['Register_of_Interests.pdf'] },
      { id: 'ag2', title: 'CEO Report & Operational Review', presenter: 'Sarah Van Der Merwe', durationMinutes: 45, isComplianceCheck: false, documents: ['CEO_Pack_Q2.pdf', 'Sales_Data.xlsx'] },
      { id: 'ag3', title: 'Audit & Risk Committee Feedback', presenter: 'Sipho Nkosi', durationMinutes: 30, isComplianceCheck: true, documents: ['Risk_Register.pdf', 'Audit_Minutes.pdf'] },
      { id: 'ag4', title: 'Approval of Annual Financial Statements', presenter: 'CFO', durationMinutes: 20, isComplianceCheck: true, documents: ['AFS_Draft_Final.pdf'] },
      { id: 'ag5', title: 'General', presenter: 'All', durationMinutes: 10, isComplianceCheck: false, documents: [] },
    ]
  },
  {
    id: 'm2',
    title: 'Social & Ethics Committee',
    date: '2024-06-10T14:00:00',
    status: MeetingStatus.SCHEDULED,
    location: 'Cape Town Branch / Teams',
    agenda: []
  }
];

export const MOCK_DOCUMENTS: RepositoryDoc[] = [
  { id: 'd1', title: 'Q1 Board Minutes - Signed', type: 'MINUTES', date: '2024-02-28', size: '2.4 MB', uploadedBy: 'Priya Patel' },
  { id: 'd2', title: 'FY2024 Annual Financial Statements', type: 'FINANCIALS', date: '2024-03-15', size: '14.2 MB', uploadedBy: 'CFO' },
  { id: 'd3', title: 'Social & Ethics Committee Charter v2', type: 'POLICY', date: '2023-11-10', size: '0.8 MB', uploadedBy: 'Priya Patel' },
  { id: 'd4', title: 'Q2 Board Pack (Draft)', type: 'PACK', date: '2024-05-18', size: '45.1 MB', uploadedBy: 'Sarah Van Der Merwe' },
  { id: 'd5', title: 'Remuneration Policy 2024', type: 'POLICY', date: '2024-01-20', size: '1.2 MB', uploadedBy: 'Priya Patel' },
];

export const PAST_MINUTES_MOCK = `
MINUTES OF THE PREVIOUS MEETING HELD ON 24 FEBRUARY 2024.
3. MATTERS ARISING:
3.1. The Chair noted that the ESG policy update is still outstanding. Sarah Van Der Merwe to prioritize this for the Q2 meeting.
3.2. Compliance: Sipho Nkosi to investigate the new JSE listing requirements regarding climate disclosure and report back.
3.3. HR Director to circulate the revised remuneration policy by 30 March 2024.
4. NEW BUSINESS:
4.1. The Board approved the acquisition of TechSol (Pty) Ltd.
`;

export const LATEST_PACK_CONTENT = `
BOARD PACK: Q2 STRATEGY & OPERATIONS REVIEW
1. EXECUTIVE SUMMARY
The company has seen a 15% growth in Q2. Key focus areas remain B-BBEE compliance and the acquisition of TechSol.
2. OPERATIONAL REPORT
- Sales up by 12% YoY.
- Supply chain disruptions in Durban port affecting lead times.
3. FINANCIALS
- Revenue: R450m
- EBITDA: R85m
4. GOVERNANCE & RISK
- IT Security Audit revealed minor vulnerabilities (Patched).
- Pending: Finalization of Social & Ethics Charter updates.
- Risk: Potential labor strike in sector.
5. STRATEGIC PROJECTS
- Project Alpha (TechSol Acquisition): Due diligence complete. Awaiting Competition Commission approval.
`;

export const SA_COMPLIANCE_CHECKS = [
  "Companies Act 71 of 2008 Compliance",
  "King IV Report on Corporate Governance",
  "JSE Listing Requirements",
  "B-BBEE Codes of Good Practice"
];