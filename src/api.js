const BASE = '/api';

async function handleRes(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  if (res.status === 204) return null;
  return res.json();
}

export function fetchPeople() {
  return fetch(`${BASE}/people`, { cache: 'no-store' }).then(handleRes);
}

export function fetchPerson(id) {
  return fetch(`${BASE}/people/${encodeURIComponent(id)}`, { cache: 'no-store' }).then(handleRes);
}

export function createPerson(data, profilePassword) {
  return fetch(`${BASE}/people`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, profilePassword }),
  }).then(handleRes);
}

export function updatePerson(id, data, profilePassword) {
  return fetch(`${BASE}/people/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, profilePassword }),
  }).then(handleRes);
}

export function claimPerson(id, newPassword) {
  return fetch(`${BASE}/people/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'claim', newPassword }),
  }).then(handleRes);
}

export function deletePerson(id, profilePassword) {
  return fetch(`${BASE}/people/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profilePassword }),
  }).then(handleRes);
}

// Photos are sent to the API as base64 data URLs (rather than multipart
// form data) so a plain JSON body is enough for every request.
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
