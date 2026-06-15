function getHeaders() {
  const token = localStorage.getItem('proman_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export async function fetchCalendarEvents(params) {
  const query = new URLSearchParams();
  if (params) {
    if (params.month) query.append('month', params.month);
    if (params.project_id) query.append('project_id', params.project_id);
    if (params.type) query.append('type', params.type);
  }

  const response = await fetch(`/api/calendar/events?${query.toString()}`, {
    headers: getHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch calendar events');
  }
  return response.json();
}

export async function fetchUpcomingEvents(params) {
  const query = new URLSearchParams();
  if (params && params.project_id) {
    query.append('project_id', params.project_id);
  }

  const response = await fetch(`/api/calendar/upcoming?${query.toString()}`, {
    headers: getHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch upcoming events');
  }
  return response.json();
}

export async function fetchEventsByDate(date, params) {
  const query = new URLSearchParams();
  if (params && params.project_id) {
    query.append('project_id', params.project_id);
  }

  const response = await fetch(`/api/calendar/events/${date}?${query.toString()}`, {
    headers: getHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch events for this date');
  }
  return response.json();
}

export async function createCalendarEvent(data) {
  const response = await fetch('/api/calendar/events', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create calendar event');
  }
  return response.json();
}

export async function updateCalendarEvent(id, data) {
  const response = await fetch(`/api/calendar/events/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update calendar event');
  }
  return response.json();
}

export async function deleteCalendarEvent(id) {
  const response = await fetch(`/api/calendar/events/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete calendar event');
  }
}
