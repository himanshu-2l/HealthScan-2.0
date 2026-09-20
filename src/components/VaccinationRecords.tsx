import { useState, useEffect } from 'react';
import { Syringe, Plus, CheckCircle2, Clock, AlertTriangle, Calendar, Edit2, Trash2, X, ChevronDown, ChevronUp, Search } from 'lucide-react';
import {
  VaccinationRecord,
  vaccineCatalog,
  getVaccinations,
  addVaccination,
  updateVaccination,
  deleteVaccination,
  getVaccinationStats,
  getVaccineProgress,
  getUpcomingVaccinations
} from '../services/vaccinationService';

type FilterStatus = 'all' | 'complete' | 'in-progress' | 'overdue' | 'upcoming';

interface FormData {
  vaccineName: string;
  vaccineType: string;
  doseNumber: number;
  totalDoses: number;
  dateAdministered: string;
  nextDoseDate: string;
  provider: string;
  location: string;
  batchNumber: string;
  notes: string;
}

const initialFormData: FormData = {
  vaccineName: '',
  vaccineType: '',
  doseNumber: 1,
  totalDoses: 1,
  dateAdministered: new Date().toISOString().split('T')[0],
  nextDoseDate: '',
  provider: '',
  location: '',
  batchNumber: '',
  notes: ''
};

export default function VaccinationRecords() {
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);
  const [stats, setStats] = useState({ total: 0, complete: 0, inProgress: 0, overdue: 0, upcoming: 0 });
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [expandedVaccine, setExpandedVaccine] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = () => {
    setVaccinations(getVaccinations());
    setStats(getVaccinationStats());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (vaccineType?: string) => {
    if (vaccineType) {
      const catalog = vaccineCatalog.find(v => v.type === vaccineType);
      const progress = getVaccineProgress(vaccineType);
      if (catalog) {
        setFormData({
          ...initialFormData,
          vaccineName: catalog.name,
          vaccineType: catalog.type,
          totalDoses: catalog.totalDoses,
          doseNumber: progress ? progress.completedDoses + 1 : 1
        });
      }
    } else {
      setFormData(initialFormData);
    }
    setEditingId(null);
    setShowModal(true);
  };

  const handleEdit = (record: VaccinationRecord) => {
    setFormData({
      vaccineName: record.vaccineName,
      vaccineType: record.vaccineType,
      doseNumber: record.doseNumber,
      totalDoses: record.totalDoses,
      dateAdministered: record.dateAdministered,
      nextDoseDate: record.nextDoseDate || '',
      provider: record.provider,
      location: record.location,
      batchNumber: record.batchNumber || '',
      notes: record.notes
    });
    setEditingId(record.id);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this vaccination record?')) {
      deleteVaccination(id);
      loadData();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const recordData = {
      vaccineName: formData.vaccineName,
      vaccineType: formData.vaccineType || formData.vaccineName,
      doseNumber: formData.doseNumber,
      totalDoses: formData.totalDoses,
      dateAdministered: formData.dateAdministered,
      nextDoseDate: formData.nextDoseDate || undefined,
      provider: formData.provider,
      location: formData.location,
      batchNumber: formData.batchNumber || undefined,
      notes: formData.notes
    };

    if (editingId) {
      updateVaccination(editingId, recordData);
    } else {
      addVaccination(recordData);
    }

    setShowModal(false);
    setFormData(initialFormData);
    setEditingId(null);
    loadData();
  };

  const handleVaccineSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'custom') {
      setFormData({ ...formData, vaccineName: '', vaccineType: '', totalDoses: 1 });
    } else {
      const catalog = vaccineCatalog.find(v => v.type === value);
      if (catalog) {
        setFormData({
          ...formData,
          vaccineName: catalog.name,
          vaccineType: catalog.type,
          totalDoses: catalog.totalDoses
        });
      }
    }
  };

  const getStatusBadge = (status: VaccinationRecord['status']) => {
    const styles = {
      complete: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'in-progress': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      overdue: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    };
    const labels = {
      complete: 'Complete',
      'in-progress': 'In Progress',
      overdue: 'Overdue',
      upcoming: 'Upcoming'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const filteredVaccinations = vaccinations.filter(v => {
    const matchesFilter = filterStatus === 'all' || v.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      v.vaccineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.provider.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const upcomingVaccinations = getUpcomingVaccinations();

  const getDaysUntil = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
              <Syringe className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
            </div>
            <span className="text-white/60 text-xs sm:text-sm">Total</span>
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-white">{stats.total}</p>
        </div>
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            </div>
            <span className="text-white/60 text-xs sm:text-sm">Up to Date</span>
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-emerald-400">{stats.complete}</p>
        </div>
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
            </div>
            <span className="text-white/60 text-xs sm:text-sm">Overdue</span>
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-rose-400">{stats.overdue}</p>
        </div>
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <span className="text-white/60 text-xs sm:text-sm">Upcoming</span>
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-blue-400">{stats.upcoming}</p>
        </div>
      </div>

      {/* Vaccine Catalog */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Vaccine Catalog</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {vaccineCatalog.map(vaccine => {
            const progress = getVaccineProgress(vaccine.type);
            const isExpanded = expandedVaccine === vaccine.type;
            return (
              <div key={vaccine.type} className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedVaccine(isExpanded ? null : vaccine.type)}
                  className="w-full p-4 text-left flex items-start gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <Syringe className="w-5 h-5 text-white/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{vaccine.name}</h3>
                    <p className="text-white/40 text-sm">
                      {progress ? progress.completedDoses : 0} of {vaccine.totalDoses} doses
                    </p>
                    <div className="mt-2 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          progress?.isComplete ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                        style={{ width: `${((progress?.completedDoses || 0) / vaccine.totalDoses) * 100}%` }}
                      />
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-white/40 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/[0.06] pt-3">
                    <p className="text-white/60 text-sm mb-3">{vaccine.description}</p>
                    {progress?.isComplete ? (
                      <div className="flex items-center gap-2 text-emerald-400 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Fully vaccinated</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenModal(vaccine.type)}
                        className="w-full py-2 px-3 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.06] rounded-xl text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Dose {(progress?.completedDoses || 0) + 1}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Records List */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-white">Vaccination Records</h2>
          <button
            onClick={() => handleOpenModal()}
            className="py-2 px-4 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] rounded-xl text-white text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Record
          </button>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'complete', 'in-progress', 'overdue', 'upcoming'] as FilterStatus[]).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-white/[0.12] text-white border border-white/[0.12]'
                    : 'bg-white/[0.04] text-white/60 border border-white/[0.06] hover:bg-white/[0.08]'
                }`}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/[0.12]"
            />
          </div>
        </div>

        {/* Records Grid */}
        {filteredVaccinations.length === 0 ? (
          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 sm:p-8 text-center">
            <Syringe className="w-10 h-10 sm:w-12 sm:h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60 text-sm sm:text-base">No vaccination records found</p>
            <p className="text-white/40 text-xs sm:text-sm mt-1">Add your first record to get started</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {filteredVaccinations.map(record => (
              <div
                key={record.id}
                className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <Syringe className="w-5 h-5 sm:w-6 sm:h-6 text-white/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-white font-medium">{record.vaccineName}</h3>
                    {getStatusBadge(record.status)}
                  </div>
                  <p className="text-white/60 text-sm mt-1">
                    Dose {record.doseNumber} of {record.totalDoses} • {new Date(record.dateAdministered).toLocaleDateString()}
                  </p>
                  <p className="text-white/40 text-sm">
                    {record.provider} {record.location && `• ${record.location}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(record)}
                    className="p-2 hover:bg-white/[0.08] rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-white/60" />
                  </button>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="p-2 hover:bg-rose-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Vaccinations */}
      {upcomingVaccinations.length > 0 && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Upcoming Vaccinations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {upcomingVaccinations.map(record => {
              const daysUntil = getDaysUntil(record.nextDoseDate!);
              return (
                <div
                  key={record.id}
                  className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{record.vaccineName}</h3>
                      <p className="text-white/60 text-sm">
                        Dose {record.doseNumber + 1} of {record.totalDoses}
                      </p>
                      <p className="text-blue-400 text-sm mt-2 font-medium">
                        {daysUntil === 0 ? 'Due today' : daysUntil === 1 ? 'Due tomorrow' : `Due in ${daysUntil} days`}
                      </p>
                      <p className="text-white/40 text-sm">
                        {new Date(record.nextDoseDate!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#12121a] border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
              <h2 className="text-lg font-semibold text-white">
                {editingId ? 'Edit Vaccination Record' : 'Add Vaccination Record'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/[0.08] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-white/60 text-sm mb-2">Vaccine</label>
                <select
                  value={formData.vaccineType || 'custom'}
                  onChange={handleVaccineSelect}
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-white/[0.12]"
                >
                  <option value="custom">Custom Vaccine</option>
                  {vaccineCatalog.map(v => (
                    <option key={v.type} value={v.type}>{v.name}</option>
                  ))}
                </select>
              </div>
              {(!formData.vaccineType || formData.vaccineType === '') && (
                <div>
                  <label className="block text-white/60 text-sm mb-2">Vaccine Name</label>
                  <input
                    type="text"
                    value={formData.vaccineName}
                    onChange={e => setFormData({ ...formData, vaccineName: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/[0.12]"
                    placeholder="Enter vaccine name"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-2">Dose Number</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.doseNumber}
                    onChange={e => setFormData({ ...formData, doseNumber: parseInt(e.target.value) || 1 })}
                    required
                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-white/[0.12]"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-2">Total Doses</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalDoses}
                    onChange={e => setFormData({ ...formData, totalDoses: parseInt(e.target.value) || 1 })}
                    required
                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-white/[0.12]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-2">Date Administered</label>
                  <input
                    type="date"
                    value={formData.dateAdministered}
                    onChange={e => setFormData({ ...formData, dateAdministered: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-white/[0.12]"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-2">Next Dose Date</label>
                  <input
                    type="date"
                    value={formData.nextDoseDate}
                    onChange={e => setFormData({ ...formData, nextDoseDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-white/[0.12]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-2">Provider</label>
                <input
                  type="text"
                  value={formData.provider}
                  onChange={e => setFormData({ ...formData, provider: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/[0.12]"
                  placeholder="Healthcare provider name"
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/[0.12]"
                  placeholder="Clinic or hospital name"
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-2">Batch Number (Optional)</label>
                <input
                  type="text"
                  value={formData.batchNumber}
                  onChange={e => setFormData({ ...formData, batchNumber: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/[0.12]"
                  placeholder="Vaccine batch/lot number"
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/[0.12] resize-none"
                  placeholder="Any additional notes..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 px-4 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-white/[0.12] hover:bg-white/[0.16] border border-white/[0.12] rounded-xl text-white font-medium transition-colors"
                >
                  {editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
