const API_BASE_URL = 'http://localhost:5068/api';
const TOKEN_STORAGE_KEY = 'omnichannel_token';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function getCurrentUser() {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.UserId,
      organizationId: payload.OrganizationId,
      role: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
    };
  } catch {
    return null;
  }
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getStoredToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const envelope = await response.json().catch(() => null);

  if (!response.ok || !envelope?.success) {
    const message = envelope?.message || envelope?.errors?.[0] || 'Something went wrong.';
    throw new Error(message);
  }

  return envelope.data;
}

export async function loginUser(email, password) {
  const data = await request('/auth/login', { method: 'POST', body: { email, password } });
  setStoredToken(data.accessToken);
  return data;
}

export async function getOrganizations() {
  return request('/organizations', { auth: true });
}

export async function getConversations() {
  return request('/conversations', { auth: true });
}

export async function getConversationById(id) {
  return request(`/conversations/${id}`, { auth: true });
}

export async function createConversation({ customerId, channel, status = 'Open' }) {
  return request('/conversations', {
    method: 'POST',
    auth: true,
    body: { customerId, channel, status, assignedUserId: null }
  });
}

export async function getCustomers() {
  return request('/customers', { auth: true });
}

export async function createCustomer({ fullName, phone = '', email = '' }) {
  return request('/customers', {
    method: 'POST',
    auth: true,
    body: { fullName, phone, email }
  });
}

export async function getMessages(conversationId) {
  return request(`/messages/conversation/${conversationId}`, { auth: true });
}

export async function sendMessage({ conversationId, body, direction = 'Outbound', messageType = 'Text' }) {
  return request('/messages', {
    method: 'POST',
    auth: true,
    body: { conversationId, direction, messageType, body, attachmentUrl: null, status: 'Sent' }
  });
}

export async function getInternalNotes(conversationId) {
  return request(`/internalnotes/conversation/${conversationId}`, { auth: true });
}

export async function addInternalNote({ conversationId, body }) {
  return request('/internalnotes', {
    method: 'POST',
    auth: true,
    body: { conversationId, body }
  });
}

export async function getUsers() {
  return request('/users', { auth: true });
}

export async function createUser({ firstName, lastName, email, password, role }) {
  return request('/users', {
    method: 'POST',
    auth: true,
    body: { organizationId: '00000000-0000-0000-0000-000000000000', firstName, lastName, email, password, role }
  });
}

export async function getDepartments() {
  return request('/departments', { auth: true });
}

export async function createDepartment({ name, description = '', isActive = true }) {
  return request('/departments', { method: 'POST', auth: true, body: { name, description, isActive } });
}

export async function updateDepartment(id, { name, description = '', isActive = true }) {
  return request(`/departments/${id}`, { method: 'PUT', auth: true, body: { name, description, isActive } });
}

export async function deleteDepartment(id) {
  return request(`/departments/${id}`, { method: 'DELETE', auth: true });
}

export async function getTeams() {
  return request('/teams', { auth: true });
}

export async function createTeam({ departmentId, name, description = '', leaderId = null, isActive = true }) {
  return request('/teams', { method: 'POST', auth: true, body: { departmentId, name, description, leaderId, isActive } });
}

export async function updateTeam(id, { departmentId, name, description = '', leaderId = null, isActive = true }) {
  return request(`/teams/${id}`, { method: 'PUT', auth: true, body: { departmentId, name, description, leaderId, isActive } });
}

export async function deleteTeam(id) {
  return request(`/teams/${id}`, { method: 'DELETE', auth: true });
}

export async function getTags() {
  return request('/tags', { auth: true });
}

export async function createTag({ name, description = '', isActive = true }) {
  return request('/tags', { method: 'POST', auth: true, body: { name, description, isActive } });
}

export async function updateTag(id, { name, description = '', isActive = true }) {
  return request(`/tags/${id}`, { method: 'PUT', auth: true, body: { name, description, isActive } });
}

export async function deleteTag(id) {
  return request(`/tags/${id}`, { method: 'DELETE', auth: true });
}

export async function getNotifications(userId) {
  return request(`/notifications/user/${userId}`, { auth: true });
}

export async function markNotificationRead(id) {
  return request(`/notifications/${id}/read`, { method: 'POST', auth: true });
}

export async function getOrganizationSettings() {
  return request('/organizationsettings', { auth: true });
}

export async function createOrganizationSetting({ settingName, settingValue }) {
  return request('/organizationsettings', { method: 'POST', auth: true, body: { settingName, settingValue } });
}

export async function updateOrganizationSetting(id, { settingName, settingValue }) {
  return request(`/organizationsettings/${id}`, { method: 'PUT', auth: true, body: { settingName, settingValue } });
}

export async function deleteOrganizationSetting(id) {
  return request(`/organizationsettings/${id}`, { method: 'DELETE', auth: true });
}

export async function getChannelAccounts() {
  return request('/channelaccounts', { auth: true });
}

export async function createChannelAccount({ channelType, displayName, externalAccountId = null, accessToken = null, refreshToken = null, webhookSecret = null, status = 'Active' }) {
  return request('/channelaccounts', {
    method: 'POST',
    auth: true,
    body: { channelType, displayName, externalAccountId, accessToken, refreshToken, webhookSecret, status }
  });
}

export async function deleteChannelAccount(id) {
  return request(`/channelaccounts/${id}`, { method: 'DELETE', auth: true });
}

export async function getAuditLogs() {
  return request('/auditlogs', { auth: true });
}

export async function getOrganizationById(id) {
  return request(`/organizations/${id}`, { auth: true });
}

export async function updateConversationStatus({ conversationId, status, changedBy, reason = null }) {
  return request('/conversationstatuses', {
    method: 'POST',
    auth: true,
    body: { conversationId, status, changedBy, reason }
  });
}

export async function assignConversation({ conversationId, assignedTo, assignedBy, reason = null }) {
  return request('/conversationassignments', {
    method: 'POST',
    auth: true,
    body: { conversationId, assignedTo, assignedBy, reason }
  });
}
