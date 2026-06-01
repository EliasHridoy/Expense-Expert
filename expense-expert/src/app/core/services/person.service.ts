import { Injectable, inject } from '@angular/core';
import { orderBy, where } from '@angular/fire/firestore';
import { Observable, firstValueFrom } from 'rxjs';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import { Person } from '../models/person.model';

@Injectable({ providedIn: 'root' })
export class PersonService {
  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);

  private get personsPath(): string {
    return this.firestoreService.userPath(this.authService.currentUser()!.uid, 'persons');
  }

  getPersons(): Observable<Person[]> {
    return this.firestoreService.getCollection<Person>(
      this.personsPath,
      orderBy('name', 'asc')
    );
  }

  async addPerson(name: string): Promise<string> {
    return this.firestoreService.addDocument(this.personsPath, { name });
  }

  /** Adds a person only if no person with the same name (case-insensitive) exists. Returns the id. */
  async addPersonIfNotExists(name: string): Promise<string> {
    const trimmedName = name.trim();
    const all = await firstValueFrom(this.firestoreService.getCollection<Person>(this.personsPath, orderBy('name', 'asc')));
    const existing = all.find((p) => p.name.toLowerCase() === trimmedName.toLowerCase());
    if (existing) return existing.id;
    return this.firestoreService.addDocument(this.personsPath, { name: trimmedName });
  }

  async deletePerson(id: string): Promise<void> {
    return this.firestoreService.deleteDocument(`${this.personsPath}/${id}`);
  }
}

