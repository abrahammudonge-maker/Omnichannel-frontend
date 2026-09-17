const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';
const TOKEN_STORAGE_KEY = 'omnichannel_token';
const REFRESH_TOKEN_STORAGE_KEY = 'omnichannel_refresh_token';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }
}

function storeSession({ accessToken, refreshToken }) {
  setStoredToken(accessToken);
  if (refreshToken) sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
}

async function refreshSession() {
  const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  if (!refreshToken) return false;
  const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) });
  const envelope = await response.json().catch(() => null);
  if (!response.ok || !envelope?.success) return false;
  storeSession(envelope.data);
  return true;
}

export function getCurrentUser() {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const encodedPayload = token.split('.')[1];
    if (!encodedPayload) return null;
    const payload = JSON.parse(atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/')));
    return {
      userId: payload.UserId,
      organizationId: payload.OrganizationId,
      role: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
    };
  } catch {
    return null;
  }
}

async function request(path, { method = 'GET', body, auth = false } = {}, retried = false) {
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

  if (auth && response.status === 401 && !retried && await refreshSession()) {
    return request(path, { method, body, auth }, true);
  }

  if (auth && response.status === 401) {
    setStoredToken(null);
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Your session expired. Please sign in again.');
  }

  const envelope = await response.json().catch(() => null);

  if (!response.ok || !envelope?.success) {
    const message = envelope?.message || envelope?.errors?.[0] || 'Something went wrong.';
    throw new Error(message);
  }

  return envelope.data;
}

export async function loginUser(email, password) {
  const data = await request('/auth/login', { method: 'POST', body: { email, password } });
  storeSession(data);
  return data;
}

export async function registerOrganization({ organizationName, adminFirstName, adminLastName, email, password, phone, country }) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: { organizationName, adminFirstName, adminLastName, email, password, phone, country }
  });
  storeSession(data);
  return data;
}

export async function logoutUser() {
  const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  if (refreshToken) await request('/auth/logout', { method: 'POST', auth: true, body: { refreshToken } }).catch(() => {});
  setStoredToken(null);
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

export async function createConversation({ customerId, channel, status = 'Open', channelAccountId = null }) {
  return request('/conversations', {
    method: 'POST',
    auth: true,
    body: { customerId, channel, status, assignedUserId: null, channelAccountId }
  });
}

export async function getCustomers() {
  return request('/customers', { auth: true });
}

export async function createCustomer({ fullName, phone = '', email = '', facebookId = null, instagramId = null, whatsAppNumber = null }) {
  return request('/customers', {
    method: 'POST',
    auth: true,
    body: { fullName, phone, email, facebookId, instagramId, whatsAppNumber }
  });
}

export async function updateCustomer(id, values) {
  return request(`/customers/${id}`, { method: 'PUT', auth: true, body: values });
}

export async function deleteCustomer(id) {
  return request(`/customers/${id}`, { method: 'DELETE', auth: true });
}

export async function getMessages(conversationId) {
  return request(`/messages/conversation/${conversationId}`, { auth: true });
}

export async function getAllMessages() {
  return request('/messages', { auth: true });
}

export async function sendMessage({ conversationId, body, direction = 'Outbound', messageType = 'Text', attachmentId = null }) {
  return request('/messages', {
    method: 'POST',
    auth: true,
    body: { conversationId, direction, messageType, body, attachmentUrl: null, status: 'Sent', attachmentId }
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

export async function updateUser(id, values) {
  return request(`/users/${id}`, { method: 'PUT', auth: true, body: values });
}

export async function deleteUser(id) {
  return request(`/users/${id}`, { method: 'DELETE', auth: true });
}

export async function getAdminUsers() {
  return request('/admin/users', { auth: true });
}

export async function createAdminUser({ organizationId, firstName, lastName, email, password, role }) {
  return request('/admin/users', {
    method: 'POST',
    auth: true,
    body: { organizationId, firstName, lastName, email, password, role }
  });
}

export async function updateAdminUser(id, values) {
  return request(`/admin/users/${id}`, { method: 'PUT', auth: true, body: values });
}

export async function deleteAdminUser(id) {
  return request(`/admin/users/${id}`, { method: 'DELETE', auth: true });
}

export async function getAdminOrganizations() {
  return request('/admin/organizations', { auth: true });
}

export async function createAdminOrganization({ name, email, phone, country }) {
  return request('/admin/organizations', { method: 'POST', auth: true, body: { name, email, phone, country } });
}

export async function updateAdminOrganization(id, { name, email, phone, country, status }) {
  return request(`/admin/organizations/${id}`, { method: 'PUT', auth: true, body: { name, email, phone, country, status } });
}

export async function deleteAdminOrganization(id) {
  return request(`/admin/organizations/${id}`, { method: 'DELETE', auth: true });
}

export async function getAdminCustomers() {
  return request('/admin/customers', { auth: true });
}

export async function createAdminCustomer({ organizationId, fullName, phone = '', email = '', facebookId = null, instagramId = null, whatsAppNumber = null }) {
  return request('/admin/customers', { method: 'POST', auth: true, body: { organizationId, fullName, phone, email, facebookId, instagramId, whatsAppNumber } });
}

export async function updateAdminCustomer(id, values) {
  return request(`/admin/customers/${id}`, { method: 'PUT', auth: true, body: values });
}

export async function deleteAdminCustomer(id) {
  return request(`/admin/customers/${id}`, { method: 'DELETE', auth: true });
}

export async function getAdminConversations() {
  return request('/admin/conversations', { auth: true });
}

export async function createAdminConversation({ organizationId, customerId, channel, status = 'Open', assignedUserId = null }) {
  return request('/admin/conversations', { method: 'POST', auth: true, body: { organizationId, customerId, channel, status, assignedUserId } });
}

export async function updateAdminConversation(id, { status, assignedUserId = null }) {
  return request(`/admin/conversations/${id}`, { method: 'PUT', auth: true, body: { status, assignedUserId } });
}

export async function deleteAdminConversation(id) {
  return request(`/admin/conversations/${id}`, { method: 'DELETE', auth: true });
}

export async function getAdminDepartments() {
  return request('/admin/departments', { auth: true });
}

export async function createAdminDepartment({ organizationId, name, description = '', isActive = true }) {
  return request('/admin/departments', { method: 'POST', auth: true, body: { organizationId, name, description, isActive } });
}

export async function updateAdminDepartment(id, { name, description = '', isActive = true }) {
  return request(`/admin/departments/${id}`, { method: 'PUT', auth: true, body: { name, description, isActive } });
}

export async function deleteAdminDepartment(id) {
  return request(`/admin/departments/${id}`, { method: 'DELETE', auth: true });
}

export async function getAdminTeams() {
  return request('/admin/teams', { auth: true });
}

export async function createAdminTeam({ organizationId, departmentId, name, description = '', leaderId = null, isActive = true }) {
  return request('/admin/teams', { method: 'POST', auth: true, body: { organizationId, departmentId, name, description, leaderId, isActive } });
}

export async function updateAdminTeam(id, { departmentId, name, description = '', leaderId = null, isActive = true }) {
  return request(`/admin/teams/${id}`, { method: 'PUT', auth: true, body: { departmentId, name, description, leaderId, isActive } });
}

export async function deleteAdminTeam(id) {
  return request(`/admin/teams/${id}`, { method: 'DELETE', auth: true });
}

export async function getAdminOrganizationSettings() {
  return request('/admin/organization-settings', { auth: true });
}

export async function createAdminOrganizationSetting({ organizationId, settingName, settingValue }) {
  return request('/admin/organization-settings', { method: 'POST', auth: true, body: { organizationId, settingName, settingValue } });
}

export async function updateAdminOrganizationSetting(id, { settingName, settingValue }) {
  return request(`/admin/organization-settings/${id}`, { method: 'PUT', auth: true, body: { settingName, settingValue } });
}

export async function deleteAdminOrganizationSetting(id) {
  return request(`/admin/organization-settings/${id}`, { method: 'DELETE', auth: true });
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

export async function createChannelAccount({
  channelType, displayName, externalAccountId = null, externalWabaId = null, accessToken = null, refreshToken = null, webhookSecret = null,
  smtpHost = null, smtpPort = null, imapHost = null, imapPort = null, status = 'Active'
}) {
  return request('/channelaccounts', {
    method: 'POST',
    auth: true,
    body: { channelType, displayName, externalAccountId, externalWabaId, accessToken, refreshToken, webhookSecret, smtpHost, smtpPort, imapHost, imapPort, status }
  });
}

export async function updateChannelAccount(id, {
  channelType, displayName, externalAccountId = null, externalWabaId = null, accessToken = null, refreshToken = null, webhookSecret = null,
  smtpHost = null, smtpPort = null, imapHost = null, imapPort = null, status = 'Active'
}) {
  return request(`/channelaccounts/${id}`, {
    method: 'PUT',
    auth: true,
    body: { channelType, displayName, externalAccountId, externalWabaId, accessToken, refreshToken, webhookSecret, smtpHost, smtpPort, imapHost, imapPort, status }
  });
}

export async function deleteChannelAccount(id) {
  return request(`/channelaccounts/${id}`, { method: 'DELETE', auth: true });
}

export async function discoverMetaChannel({ channelType, code, redirectUri }) {
  return request('/channelaccounts/connect-meta/discover', {
    method: 'POST',
    auth: true,
    body: { channelType, code, redirectUri }
  });
}

export async function confirmMetaChannel({ channelType, sessionId, selectedId, organizationId = null }) {
  return request('/channelaccounts/connect-meta/confirm', {
    method: 'POST',
    auth: true,
    body: { channelType, sessionId, selectedId, organizationId }
  });
}

export async function getMessageTemplates() {
  return request('/messagetemplates', { auth: true });
}

export async function getMessageTemplatesByChannel(channelAccountId) {
  return request(`/messagetemplates/channel/${channelAccountId}`, { auth: true });
}

export async function createMessageTemplate({
  channelAccountId, name, language, category, headerText = null, bodyText = null, footerText = null, quickReplyButtons = null,
  addSecurityRecommendation = true, codeExpirationMinutes = null
}) {
  return request('/messagetemplates', {
    method: 'POST',
    auth: true,
    body: { channelAccountId, name, language, category, headerText, bodyText, footerText, quickReplyButtons, addSecurityRecommendation, codeExpirationMinutes }
  });
}

export async function syncMessageTemplates(channelAccountId) {
  return request(`/messagetemplates/sync/${channelAccountId}`, { method: 'POST', auth: true });
}

export async function sendTemplateMessage({ conversationId, templateId, bodyParameters = [] }) {
  return request('/messages/send-template', {
    method: 'POST',
    auth: true,
    body: { conversationId, templateId, bodyParameters }
  });
}

export async function getApiKeys() {
  return request('/apikeys', { auth: true });
}

export async function createApiKey({ name }) {
  return request('/apikeys', { method: 'POST', auth: true, body: { name } });
}

export async function revokeApiKey(id) {
  return request(`/apikeys/${id}`, { method: 'DELETE', auth: true });
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

export async function getConversationTagIds(conversationId) {
  return request(`/conversations/${conversationId}/tags`, { auth: true });
}

export async function replaceConversationTags(conversationId, tagIds) {
  return request(`/conversations/${conversationId}/tags`, { method: 'PUT', auth: true, body: { tagIds } });
}

export async function getAttachments(conversationId) {
  return request(`/attachments/conversation/${conversationId}`, { auth: true });
}

export async function uploadAttachment(conversationId, file) {
  const data = new FormData();
  data.append('conversationId', conversationId);
  data.append('file', file);
  const response = await fetch(`${API_BASE_URL}/attachments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getStoredToken()}` },
    body: data
  });
  const envelope = await response.json().catch(() => null);
  if (!response.ok || !envelope?.success) throw new Error(envelope?.message || 'Attachment upload failed.');
  return envelope.data;
}

export async function getAttachmentObjectUrl(id) {
  const response = await fetch(`${API_BASE_URL}/attachments/${id}/download`, { headers: { Authorization: `Bearer ${getStoredToken()}` } });
  if (!response.ok) throw new Error('Attachment is no longer available.');
  return URL.createObjectURL(await response.blob());
}

export async function deleteAttachment(id) {
  return request(`/attachments/${id}`, { method: 'DELETE', auth: true });
}

export async function downloadAttachment(id, fileName) {
  const response = await fetch(`${API_BASE_URL}/attachments/${id}/download`, { headers: { Authorization: `Bearer ${getStoredToken()}` } });
  if (!response.ok) throw new Error('Attachment is no longer available.');
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
