import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  collectionData,
  docData,
  query,
  QueryConstraint,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private firestore = inject(Firestore);

  getCollection<T>(path: string, ...queryConstraints: QueryConstraint[]): Observable<T[]> {
    const ref = collection(this.firestore, path);
    const q = query(ref, ...queryConstraints);
    return collectionData(q, { idField: 'id' }) as Observable<T[]>;
  }

  getDocument<T>(path: string): Observable<T> {
    const ref = doc(this.firestore, path);
    return docData(ref, { idField: 'id' }) as Observable<T>;
  }

  async addDocument<T extends Record<string, any>>(path: string, data: T): Promise<string> {
    const ref = collection(this.firestore, path);
    const docRef = await addDoc(ref, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async updateDocument(path: string, data: Record<string, any>): Promise<void> {
    const ref = doc(this.firestore, path);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  async deleteDocument(path: string): Promise<void> {
    const ref = doc(this.firestore, path);
    await deleteDoc(ref);
  }

  userPath(userId: string, subcollection: string): string {
    return `users/${userId}/${subcollection}`;
  }
}
