import { rtdb, db, firebaseConfig } from './firebase';
import { ref, set, get, remove } from 'firebase/database';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { CompetitionForm, FormSubmission } from '@/data/forms';

const DB_BASE = firebaseConfig.databaseURL.replace(/\/$/, '');

// =========================================================================
// 1. FORMS MANAGEMENT (REAL CLOUD DATABASE: FIRESTORE & RTDB)
// =========================================================================

/**
 * Fetch all forms directly from the Firebase Cloud Database
 */
export async function getFirebaseForms(): Promise<CompetitionForm[]> {
  const formsMap = new Map<string, CompetitionForm>();

  // 1. Fetch from Realtime Database (where forms are created in console)
  try {
    if (rtdb) {
      const snapshot = await get(ref(rtdb, 'forms'));
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (typeof val === 'object' && val !== null) {
          Object.values(val).forEach((f: any) => {
            if (f && f.id) formsMap.set(f.id, f as CompetitionForm);
          });
        }
      }
    }
  } catch (err) {
    console.warn('RTDB getForms notice:', err);
  }

  // 1b. Fallback to RTDB REST API if SDK is blocked or slow
  if (formsMap.size === 0) {
    try {
      const res = await fetch(`${DB_BASE}/forms.json`);
      if (res.ok) {
        const val = await res.json();
        if (val && typeof val === 'object' && val !== null) {
          Object.values(val).forEach((f: any) => {
            if (f && f.id) formsMap.set(f.id, f as CompetitionForm);
          });
        }
      }
    } catch {}
  }

  // 2. Also merge from Cloud Firestore
  try {
    if (db) {
      const snapshot = await getDocs(collection(db, 'forms'));
      snapshot.forEach(d => {
        const data = d.data() as CompetitionForm;
        if (data && data.id) {
          if (!formsMap.has(data.id)) {
            formsMap.set(data.id, data);
          }
        }
      });
    }
  } catch (err) {
    console.warn('Firestore getForms notice:', err);
  }

  // 3. Ensure both Realtime Database and Cloud Firestore stay in 100% two-way sync
  try {
    for (const form of formsMap.values()) {
      const sid = form.id.replace(/[.#$[\]]/g, '_');
      if (db) setDoc(doc(db, 'forms', sid), form).catch(() => {});
      if (rtdb) set(ref(rtdb, `forms/${sid}`), form).catch(() => {});
    }
  } catch {}

  const formsList = Array.from(formsMap.values());
  formsList.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return formsList;
}

function cleanForFirebase<T>(obj: T): T {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
}

/**
 * Save or update a form DIRECTLY in the Firebase Cloud Database
 */
export async function saveFirebaseForm(form: CompetitionForm): Promise<boolean> {
  const sanitizedId = form.id.replace(/[.#$[\]]/g, '_');
  const cleanedForm = cleanForFirebase(form);
  let saved = false;

  // 1. Save directly to Realtime Database (SDK + REST)
  try {
    if (rtdb) {
      await set(ref(rtdb, `forms/${sanitizedId}`), cleanedForm);
      saved = true;
    }
  } catch (e) {
    console.warn('RTDB saveForm error:', e);
  }

  try {
    await fetch(`${DB_BASE}/forms/${sanitizedId}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanedForm)
    });
    saved = true;
  } catch {}

  // 2. Save directly to Cloud Firestore
  try {
    if (db) {
      await setDoc(doc(db, 'forms', sanitizedId), cleanedForm);
      saved = true;
    }
  } catch (e) {
    console.warn('Firestore saveForm error:', e);
  }

  return saved;
}

/**
 * Permanently delete a form DIRECTLY from Firebase Cloud Database
 */
export async function deleteFirebaseForm(formId: string): Promise<boolean> {
  const sanitizedId = formId.replace(/[.#$[\]]/g, '_');

  // 1. Delete from Realtime Database (SDK + REST)
  try {
    if (rtdb) {
      await remove(ref(rtdb, `forms/${sanitizedId}`));
    }
  } catch (e) {
    console.warn('RTDB deleteForm error:', e);
  }

  try {
    await fetch(`${DB_BASE}/forms/${sanitizedId}.json`, { method: 'DELETE' });
  } catch (e) {
    console.warn('REST deleteForm error:', e);
  }

  // 2. Delete from Cloud Firestore
  try {
    if (db) {
      await deleteDoc(doc(db, 'forms', sanitizedId));
    }
  } catch (e) {
    console.warn('Firestore deleteForm error:', e);
  }

  // 3. Clean local cache if present
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('ncqc_competition_forms');
    } catch {}
  }

  return true;
}

// =========================================================================
// 2. SUBMISSIONS MANAGEMENT (REAL CLOUD DATABASE: FIRESTORE & RTDB)
// =========================================================================

/**
 * Fetch all submissions DIRECTLY from Firebase Cloud Database
 */
export async function getFirebaseSubmissions(): Promise<FormSubmission[]> {
  const subsMap = new Map<string, FormSubmission>();

  // 1. Fetch from Realtime Database
  try {
    if (rtdb) {
      const snapshot = await get(ref(rtdb, 'submissions'));
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (typeof val === 'object' && val !== null) {
          Object.values(val).forEach((s: any) => {
            if (s && s.id) subsMap.set(s.id, s as FormSubmission);
          });
        }
      }
    }
  } catch (err) {
    console.warn('RTDB getSubmissions notice:', err);
  }

  // 1b. Fallback to REST API
  if (subsMap.size === 0) {
    try {
      const res = await fetch(`${DB_BASE}/submissions.json`);
      if (res.ok) {
        const val = await res.json();
        if (val && typeof val === 'object' && val !== null) {
          Object.values(val).forEach((s: any) => {
            if (s && s.id) subsMap.set(s.id, s as FormSubmission);
          });
        }
      }
    } catch {}
  }

  // 2. Merge from Cloud Firestore
  try {
    if (db) {
      const snapshot = await getDocs(collection(db, 'submissions'));
      snapshot.forEach(d => {
        const data = d.data() as FormSubmission;
        if (data && data.id) {
          if (!subsMap.has(data.id)) {
            subsMap.set(data.id, data);
          }
        }
      });
    }
  } catch (err) {
    console.warn('Firestore getSubmissions notice:', err);
  }

  // 3. Two-way sync
  try {
    for (const sub of subsMap.values()) {
      const sid = sub.id.replace(/[.#$[\]]/g, '_');
      if (db) setDoc(doc(db, 'submissions', sid), sub).catch(() => {});
      if (rtdb) set(ref(rtdb, `submissions/${sid}`), sub).catch(() => {});
    }
  } catch {}

  const subsList = Array.from(subsMap.values());
  subsList.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
  return subsList;
}

/**
 * Save a new submission DIRECTLY to Firebase Cloud Database
 */
export async function saveFirebaseSubmission(sub: FormSubmission): Promise<boolean> {
  const sanitizedId = sub.id.replace(/[.#$[\]]/g, '_');
  const cleanedSub = cleanForFirebase(sub);
  let saved = false;

  // 1. Save directly to Realtime Database
  try {
    if (rtdb) {
      await set(ref(rtdb, `submissions/${sanitizedId}`), cleanedSub);
      saved = true;
    }
  } catch (e) {
    console.warn('RTDB saveSubmission error:', e);
  }

  try {
    await fetch(`${DB_BASE}/submissions/${sanitizedId}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanedSub)
    });
    saved = true;
  } catch {}

  // 2. Save directly to Cloud Firestore
  try {
    if (db) {
      await setDoc(doc(db, 'submissions', sanitizedId), cleanedSub);
      saved = true;
    }
  } catch (e) {
    console.warn('Firestore saveSubmission error:', e);
  }

  // Notify any active listeners in the browser
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ncqc_submission_saved', { detail: sub }));
  }

  return saved;
}

/**
 * Permanently delete a submission DIRECTLY from Firebase Cloud Database
 */
export async function deleteFirebaseSubmission(submissionId: string): Promise<boolean> {
  const sanitizedId = submissionId.replace(/[.#$[\]]/g, '_');

  // 1. Delete from Realtime Database (SDK + REST)
  try {
    if (rtdb) {
      await remove(ref(rtdb, `submissions/${sanitizedId}`));
    }
  } catch {}

  try {
    await fetch(`${DB_BASE}/submissions/${sanitizedId}.json`, { method: 'DELETE' });
  } catch {}

  // 2. Delete from Cloud Firestore
  try {
    if (db) {
      await deleteDoc(doc(db, 'submissions', sanitizedId));
    }
  } catch (e) {
    console.warn('Firestore deleteSubmission error:', e);
  }

  return true;
}

/**
 * Update submission status DIRECTLY in Firebase Cloud Database
 */
export async function updateFirebaseSubmissionStatus(submissionId: string, status: string): Promise<boolean> {
  const sanitizedId = submissionId.replace(/[.#$[\]]/g, '_');

  // 1. Update in Realtime Database (SDK + REST)
  try {
    if (rtdb) {
      await set(ref(rtdb, `submissions/${sanitizedId}/status`), status);
    }
  } catch {}

  try {
    await fetch(`${DB_BASE}/submissions/${sanitizedId}/status.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(status)
    });
  } catch {}

  // 2. Update directly in Cloud Firestore
  try {
    if (db) {
      await setDoc(doc(db, 'submissions', sanitizedId), { status }, { merge: true });
    }
  } catch (e) {
    console.warn('Firestore update status error:', e);
  }

  return true;
}

/**
 * Get a single submission by its ID DIRECTLY from Firebase (for QR Verification)
 */
export async function getFirebaseSubmissionById(submissionId: string): Promise<FormSubmission | null> {
  const sanitizedId = submissionId.replace(/[.#$[\]]/g, '_');

  // 1. Try Cloud Firestore (Direct Doc Lookup first, then scan if needed)
  try {
    if (db) {
      const docSnap = await getDoc(doc(db, 'submissions', sanitizedId));
      if (docSnap.exists()) {
        return docSnap.data() as FormSubmission;
      }
      const snap = await getDocs(collection(db, 'submissions'));
      for (const d of snap.docs) {
        const item = d.data() as FormSubmission;
        if (item.id === submissionId || item.id.toLowerCase() === submissionId.toLowerCase() || (item as any).referralId === submissionId) {
          return item;
        }
      }
    }
  } catch {}

  // 2. Try RTDB
  try {
    if (rtdb) {
      const snapshot = await get(ref(rtdb, `submissions/${sanitizedId}`));
      if (snapshot.exists()) {
        return snapshot.val() as FormSubmission;
      }
    }
  } catch {}

  return null;
}

// =========================================================================
// 3. FORM-TO-COMPETITION LINKING (REAL DATABASE)
// =========================================================================

export async function getFirebaseFormLinks(): Promise<Record<string, string>> {
  const links: Record<string, string> = {};

  try {
    // 1. Try Cloud Firestore
    if (db) {
      const snap = await getDocs(collection(db, 'formLinks'));
      snap.forEach(d => {
        const data = d.data();
        if (data.competitionSlug && data.formId) {
          links[data.competitionSlug] = data.formId;
        }
      });
      if (Object.keys(links).length > 0) return links;
    }

    // 2. Try RTDB
    if (rtdb) {
      const snapshot = await get(ref(rtdb, 'formLinks'));
      if (snapshot.exists()) {
        return (snapshot.val() || {}) as Record<string, string>;
      }
    }
  } catch {}

  return links;
}

export async function saveFirebaseFormLink(competitionSlug: string, formId: string): Promise<boolean> {
  const sanitizedSlug = competitionSlug.replace(/[.#$[\]]/g, '_');

  try {
    if (db) {
      await setDoc(doc(db, 'formLinks', sanitizedSlug), { competitionSlug, formId });
    }
  } catch {}

  try {
    if (rtdb) {
      await set(ref(rtdb, `formLinks/${sanitizedSlug}`), formId);
    }
  } catch {}

  return true;
}

export async function removeFirebaseFormLink(competitionSlug: string): Promise<boolean> {
  const sanitizedSlug = competitionSlug.replace(/[.#$[\]]/g, '_');

  try {
    if (db) {
      await deleteDoc(doc(db, 'formLinks', sanitizedSlug));
    }
  } catch {}

  try {
    if (rtdb) {
      await remove(ref(rtdb, `formLinks/${sanitizedSlug}`));
    }
  } catch {}

  return true;
}

// =========================================================================
// 4. FIREBASE HEALTH & DIAGNOSTIC MONITOR
// =========================================================================

export interface FirebaseHealthStatus {
  connected: boolean;
  rulesLocked: boolean;
  rtdbStatus: 'online' | 'permission-denied' | 'error';
  firestoreStatus: 'online' | 'permission-denied' | 'error';
  totalSubmissions: number;
  totalForms: number;
  message: string;
}

/**
 * Perform a live probe of Firebase Database health
 */
export async function checkFirebaseHealth(): Promise<FirebaseHealthStatus> {
  let firestoreStatus: 'online' | 'permission-denied' | 'error' = 'online';
  let rtdbStatus: 'online' | 'permission-denied' | 'error' = 'online';
  let rulesLocked = false;
  let totalSubmissions = 0;
  let totalForms = 0;

  // 1. Probe Firestore
  try {
    if (db) {
      const subSnap = await getDocs(collection(db, 'submissions'));
      totalSubmissions = subSnap.size;
      const formSnap = await getDocs(collection(db, 'forms'));
      totalForms = formSnap.size;
    }
  } catch (err: any) {
    if (err?.code === 'permission-denied' || String(err?.message || '').includes('permission')) {
      firestoreStatus = 'permission-denied';
      rulesLocked = true;
    } else {
      firestoreStatus = 'error';
    }
  }

  // 2. Probe Realtime Database
  try {
    if (rtdb) {
      const snapshot = await get(ref(rtdb, 'forms'));
      if (!snapshot.exists()) {
        // ok
      }
    }
  } catch (err: any) {
    if (String(err?.message || '').includes('Permission denied')) {
      rtdbStatus = 'permission-denied';
    } else {
      rtdbStatus = 'error';
    }
  }

  const connected = firestoreStatus === 'online';
  const message = connected 
    ? 'Firebase Cloud Database is 100% connected and active.'
    : 'Firebase security rules need to be updated in Firebase Console.';

  return {
    connected,
    rulesLocked,
    rtdbStatus,
    firestoreStatus,
    totalSubmissions,
    totalForms,
    message
  };
}

/**
 * Bulk sync all locally held submissions to Firebase
 */
export async function syncLocalSubmissionsToFirebase(): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  if (typeof window === 'undefined') return { success, failed };

  try {
    const local: FormSubmission[] = JSON.parse(localStorage.getItem('ncqc_competition_submissions') || '[]');
    for (const sub of local) {
      const ok = await saveFirebaseSubmission(sub);
      if (ok) success++;
      else failed++;
    }
    if (success > 0) {
      localStorage.removeItem('ncqc_competition_submissions');
    }
  } catch {}

  return { success, failed };
}
