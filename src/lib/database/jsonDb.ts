import fs from 'fs';
import path from 'path';

// Use project root data directory for Next.js
const DB_PATH = path.join(process.cwd(), 'data');

interface Database {
  companies: any[];
  shareClasses: any[];
  valuations: any[];
  nextId: { [key: string]: number };
}

class JsonDatabase {
  private dbPath: string;
  private db: Database | null = null;

  constructor() {
    this.dbPath = path.join(DB_PATH, 'database.json');
    this.initializeDb();
  }

  private initializeDb() {
    if (!fs.existsSync(DB_PATH)) {
      fs.mkdirSync(DB_PATH, { recursive: true });
    }

    if (!fs.existsSync(this.dbPath)) {
      const initialDb: Database = {
        companies: [],
        shareClasses: [],
        valuations: [],
        nextId: { companies: 1, shareClasses: 1, valuations: 1 }
      };
      fs.writeFileSync(this.dbPath, JSON.stringify(initialDb, null, 2));
    }
  }

  private loadData(): Database {
    if (!this.db) {
      const data = fs.readFileSync(this.dbPath, 'utf-8');
      this.db = JSON.parse(data);
    }
    return this.db!; // Assert non-null since we initialize in constructor
  }

  private saveData() {
    if (this.db) {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.db, null, 2));
    }
  }

  private getNextId(table: string): number {
    const db = this.loadData();
    const id = db.nextId[table] || 1;
    db.nextId[table] = id + 1;
    return id;
  }

  // Companies
  getAllCompanies() {
    const db = this.loadData();
    return db.companies;
  }

  getCompanyById(id: number) {
    const db = this.loadData();
    return db.companies.find(c => c.id === id);
  }

  createCompany(data: any) {
    const db = this.loadData();
    const company = {
      id: this.getNextId('companies'),
      ...data,
      status: data.status || 'active', // Default to active status
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.companies.push(company);
    this.saveData();
    return company;
  }

  updateCompany(id: number, data: any) {
    const db = this.loadData();
    const index = db.companies.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    db.companies[index] = {
      ...db.companies[index],
      ...data,
      id: id, // Ensure ID doesn't change
      created_at: db.companies[index].created_at, // Preserve created_at
      updated_at: new Date().toISOString()
    };
    this.saveData();
    return db.companies[index];
  }

  deleteCompany(id: number) {
    const db = this.loadData();
    const index = db.companies.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    db.companies.splice(index, 1);
    this.saveData();
    return true;
  }

  // Share Classes
  getShareClassesByCompany(companyId: number) {
    const db = this.loadData();
    return db.shareClasses
      .filter(sc => sc.companyId === companyId)
      .sort((a, b) => (a.seniority_rank || 1) - (b.seniority_rank || 1));
  }

  createShareClass(companyId: number, data: any) {
    const db = this.loadData();
    const shareClass = {
      id: this.getNextId('shareClasses'),
      company_id: companyId,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.shareClasses.push(shareClass);
    this.saveData();
    return shareClass;
  }

  // Valuations
  getAllValuations() {
    const db = this.loadData();
    return db.valuations
      .sort((a, b) => new Date(b.valuation_date || b.created_at).getTime() - new Date(a.valuation_date || a.created_at).getTime());
  }

  getValuationsByCompany(companyId: number) {
    const db = this.loadData();
    return db.valuations
      .filter(v => v.companyId === companyId)
      .sort((a, b) => new Date(b.valuationDate || b.createdAt).getTime() - new Date(a.valuationDate || a.createdAt).getTime());
  }

  createValuation(companyId: number, data: any) {
    const db = this.loadData();
    const valuation = {
      id: this.getNextId('valuations'),
      company_id: companyId,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.valuations.push(valuation);
    this.saveData();
    return valuation;
  }

  getValuationById(id: number) {
    const db = this.loadData();
    return db.valuations.find(v => v.id === id);
  }

  updateValuation(id: number, data: any) {
    const db = this.loadData();
    const index = db.valuations.findIndex(v => v.id === id);
    if (index === -1) return null;
    
    db.valuations[index] = {
      ...db.valuations[index],
      ...data,
      id: id, // Ensure ID doesn't change
      company_id: db.valuations[index].company_id, // Ensure company_id doesn't change
      created_at: db.valuations[index].created_at, // Preserve created_at
      updated_at: new Date().toISOString()
    };
    this.saveData();
    return db.valuations[index];
  }

  deleteValuation(id: number) {
    const db = this.loadData();
    const index = db.valuations.findIndex(v => v.id === id);
    if (index === -1) return false;
    
    db.valuations.splice(index, 1);
    this.saveData();
    return true;
  }
}

// Create singleton instance
const jsonDb = new JsonDatabase();
export default jsonDb;