export const MANAGE_EVENT_TABS = [
  'registrations',
  'shifts',
  'checkin',
  'campaigns',
  'corporate',
  'report',
];

export const EMPTY_SHIFT_FORM = {
  name: '',
  startTime: '',
  endTime: '',
  maxVolunteers: 10,
  createChannel: true,
};

export const EMPTY_EDIT_SHIFT_FORM = {
  name: '',
  startTime: '',
  endTime: '',
  maxVolunteers: 10,
};

export const EMPTY_CAMPAIGN_FORM = {
  title: '',
  description: '',
  targetAmount: '',
  minimumAmount: '',
  startDate: '',
  endDate: '',
  receiveInfo: '',
  transparencyNote: '',
  status: 'Draft',
  bankBin: '',
  bankAccountNo: '',
  bankAccountName: '',
};

export const EMPTY_PROPOSAL_FORM = {
  sponsorId: '',
  title: '',
  message: '',
  requestedAmount: '',
  purpose: '',
  sponsorBenefits: '',
  attachmentUrl: '',
};

export const EMPTY_FINANCIAL_REPORT_FORM = {
  usedAmount: '',
  summary: '',
  expenseDetails: '',
  attachmentUrl: '',
};

export const EMPTY_WALK_IN_FORM = {
  volunteerUserId: '',
  shiftId: '',
  note: '',
};

export const EMPTY_INTERVIEW_FORM = {
  scheduledAt: '',
  meetingUrl: '',
  durationMinutes: 30,
  note: '',
};
