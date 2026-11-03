import Dexie, { type Table } from 'dexie';

export interface HistoryItem {
  id?: number;
  text: string;
  verdict: 'Safe' | 'Suspicious' | 'Likely Scam';
  score: number;
  timestamp: Date;
}

export class ScamShieldDatabase extends Dexie {
  history!: Table<HistoryItem>;

  constructor() {
    super('ScamShieldDB');
    this.version(1).stores({
      history: '++id, verdict, score, timestamp',
    });
  }
}

export const db = new ScamShieldDatabase();