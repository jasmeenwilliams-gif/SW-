import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import type { OpsCheckin } from '../data/opsData';
import { auth, db, handleFirestoreError, OperationType } from './firebase';

const VALID_TYPES = new Set<OpsCheckin['type']>([
  'Phone',
  'Home visit',
  'Pill tray review',
  'Self-advocacy check-in',
  'Appointment Accompaniment',
]);

export async function addCheckIn(
  clientId: string,
  note: string,
  options?: { date?: string; type?: OpsCheckin['type'] }
): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Please sign in with Google before saving a check-in to Firestore.');
  }

  const cleanClientId = clientId.trim().replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64) || 'SW-CLIENT';
  const cleanNote = note.trim().slice(0, 1000);
  if (!cleanNote) {
    throw new Error('Check-in note cannot be empty.');
  }

  const cleanDate = (options?.date || new Date().toISOString().slice(0, 10)).slice(0, 20);
  const cleanType: OpsCheckin['type'] =
    options?.type && VALID_TYPES.has(options.type) ? options.type : 'Phone';

  try {
    const docRef = await addDoc(collection(db, 'checkins'), {
      ownerId: currentUser.uid,
      clientId: cleanClientId,
      date: cleanDate,
      type: cleanType,
      note: cleanNote,
      done: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'checkins');
  }
}

export async function toggleCheckInDone(docId: string, nextDone: boolean): Promise<void> {
  const path = `checkins/${docId}`;
  try {
    await updateDoc(doc(db, 'checkins', docId), {
      done: nextDone,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export function subscribeCheckIns(
  userId: string,
  isAdmin: boolean,
  onData: (items: OpsCheckin[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const sourceQuery = isAdmin
    ? collection(db, 'checkins')
    : query(collection(db, 'checkins'), where('ownerId', '==', userId));

  return onSnapshot(
    sourceQuery,
    (snapshot) => {
      const mapped = snapshot.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        const rawType = String(data.type ?? 'Phone');
        const type: OpsCheckin['type'] = VALID_TYPES.has(rawType as OpsCheckin['type'])
          ? (rawType as OpsCheckin['type'])
          : 'Phone';
        const created = data.createdAt as Timestamp | undefined;
        const ms =
          created && typeof created === 'object' && 'toMillis' in created
            ? created.toMillis()
            : 0;

        return {
          ms,
          item: {
            docId: d.id,
            client: String(data.clientId ?? ''),
            date: String(data.date ?? ''),
            type,
            note: String(data.note ?? ''),
            done: Boolean(data.done),
          } satisfies OpsCheckin,
        };
      });

      mapped.sort((a, b) => b.ms - a.ms);
      onData(mapped.map((m) => m.item));
    },
    (listenErr) => {
      try {
        handleFirestoreError(listenErr, OperationType.LIST, 'checkins');
      } catch (wrappedErr) {
        onError(wrappedErr instanceof Error ? wrappedErr : new Error(String(wrappedErr)));
      }
    }
  );
}
