export interface VaccinationRecord {
  id: string;
  vaccineName: string;
  vaccineType: string;
  doseNumber: number;
  totalDoses: number;
  dateAdministered: string;
  nextDoseDate?: string;
  provider: string;
  location: string;
  batchNumber?: string;
  notes: string;
  status: 'complete' | 'in-progress' | 'overdue' | 'upcoming';
}

export interface VaccineCatalogItem {
  name: string;
  type: string;
  totalDoses: number;
  doseIntervalDays?: number[];
  description: string;
}

const STORAGE_KEY = 'healthscan_vaccinations';

export const vaccineCatalog: VaccineCatalogItem[] = [
  {
    name: 'COVID-19',
    type: 'COVID-19',
    totalDoses: 3,
    doseIntervalDays: [21, 180],
    description: 'Protection against COVID-19 coronavirus'
  },
  {
    name: 'Influenza',
    type: 'Flu',
    totalDoses: 1,
    description: 'Annual flu shot for seasonal protection'
  },
  {
    name: 'Hepatitis B',
    type: 'Hepatitis B',
    totalDoses: 3,
    doseIntervalDays: [30, 150],
    description: 'Protection against Hepatitis B virus'
  },
  {
    name: 'MMR',
    type: 'MMR',
    totalDoses: 2,
    doseIntervalDays: [28],
    description: 'Measles, Mumps, and Rubella vaccine'
  },
  {
    name: 'Tdap',
    type: 'Tdap',
    totalDoses: 1,
    description: 'Tetanus, Diphtheria, and Pertussis booster'
  },
  {
    name: 'Polio',
    type: 'Polio',
    totalDoses: 4,
    doseIntervalDays: [60, 60, 180],
    description: 'Protection against poliovirus'
  },
  {
    name: 'Varicella',
    type: 'Varicella',
    totalDoses: 2,
    doseIntervalDays: [90],
    description: 'Chickenpox vaccine'
  },
  {
    name: 'HPV',
    type: 'HPV',
    totalDoses: 3,
    doseIntervalDays: [60, 120],
    description: 'Human Papillomavirus vaccine'
  }
];

const generateId = (): string => {
  return `vac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const calculateStatus = (record: Omit<VaccinationRecord, 'status'>): VaccinationRecord['status'] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (record.doseNumber >= record.totalDoses) {
    return 'complete';
  }

  if (record.nextDoseDate) {
    const nextDate = new Date(record.nextDoseDate);
    nextDate.setHours(0, 0, 0, 0);

    if (nextDate < today) {
      return 'overdue';
    }

    const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 30) {
      return 'upcoming';
    }
  }

  return 'in-progress';
};

export const getVaccinations = (): VaccinationRecord[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const records: VaccinationRecord[] = JSON.parse(data);
    return records.map(record => ({
      ...record,
      status: calculateStatus(record)
    }));
  } catch {
    return [];
  }
};

export const getVaccinationById = (id: string): VaccinationRecord | undefined => {
  const vaccinations = getVaccinations();
  return vaccinations.find(v => v.id === id);
};

export const addVaccination = (
  record: Omit<VaccinationRecord, 'id' | 'status'>
): VaccinationRecord => {
  const vaccinations = getVaccinations();
  
  const newRecord: VaccinationRecord = {
    ...record,
    id: generateId(),
    status: calculateStatus(record)
  };

  vaccinations.push(newRecord);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vaccinations));
  
  return newRecord;
};

export const updateVaccination = (
  id: string,
  updates: Partial<Omit<VaccinationRecord, 'id' | 'status'>>
): VaccinationRecord | null => {
  const vaccinations = getVaccinations();
  const index = vaccinations.findIndex(v => v.id === id);
  
  if (index === -1) return null;

  const updatedRecord = {
    ...vaccinations[index],
    ...updates
  };
  
  updatedRecord.status = calculateStatus(updatedRecord);
  vaccinations[index] = updatedRecord;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vaccinations));
  
  return updatedRecord;
};

export const deleteVaccination = (id: string): boolean => {
  const vaccinations = getVaccinations();
  const filtered = vaccinations.filter(v => v.id !== id);
  
  if (filtered.length === vaccinations.length) return false;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
};

export const getVaccinationStats = () => {
  const vaccinations = getVaccinations();
  
  return {
    total: vaccinations.length,
    complete: vaccinations.filter(v => v.status === 'complete').length,
    inProgress: vaccinations.filter(v => v.status === 'in-progress').length,
    overdue: vaccinations.filter(v => v.status === 'overdue').length,
    upcoming: vaccinations.filter(v => v.status === 'upcoming').length
  };
};

export const getVaccineProgress = (vaccineType: string) => {
  const vaccinations = getVaccinations();
  const catalogItem = vaccineCatalog.find(v => v.type === vaccineType);
  const records = vaccinations.filter(v => v.vaccineType === vaccineType);
  
  if (!catalogItem) return null;
  
  const completedDoses = records.length > 0 
    ? Math.max(...records.map(r => r.doseNumber))
    : 0;
  
  const latestRecord = records.length > 0
    ? records.reduce((latest, r) => 
        new Date(r.dateAdministered) > new Date(latest.dateAdministered) ? r : latest
      )
    : null;

  return {
    vaccine: catalogItem,
    completedDoses,
    totalDoses: catalogItem.totalDoses,
    isComplete: completedDoses >= catalogItem.totalDoses,
    latestRecord,
    records
  };
};

export const getUpcomingVaccinations = (): VaccinationRecord[] => {
  const vaccinations = getVaccinations();
  const today = new Date();
  
  return vaccinations
    .filter(v => v.nextDoseDate && new Date(v.nextDoseDate) >= today)
    .sort((a, b) => 
      new Date(a.nextDoseDate!).getTime() - new Date(b.nextDoseDate!).getTime()
    );
};
