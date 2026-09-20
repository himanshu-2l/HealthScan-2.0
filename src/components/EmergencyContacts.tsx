/**
 * Emergency Contacts & Medical ID Component
 * SOS quick-dial, emergency contact management, and medical ID storage
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { VoiceInputButton } from './ui/VoiceInputButton';
import {
  ShieldAlert,
  Phone,
  Plus,
  Trash2,
  Edit,
  Heart,
  AlertTriangle,
  X,
  User,
  Mail,
  FileText,
  Ambulance,
  Star,
  StarOff,
  Check,
  Droplet,
  Pill,
  Activity,
  Stethoscope,
} from 'lucide-react';

// Data Models
interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  notes?: string;
}

interface MedicalID {
  bloodType: string;
  allergies: string[];
  medications: string[];
  conditions: string[];
  organDonor: boolean;
  emergencyNotes: string;
}

// localStorage keys
const CONTACTS_KEY = 'healthscan_emergency_contacts';
const MEDICAL_ID_KEY = 'healthscan_medical_id';

// Helper functions
const generateId = () => Math.random().toString(36).substring(2, 15);

const loadContacts = (): EmergencyContact[] => {
  try {
    const data = localStorage.getItem(CONTACTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveContacts = (contacts: EmergencyContact[]) => {
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
};

const loadMedicalID = (): MedicalID | null => {
  try {
    const data = localStorage.getItem(MEDICAL_ID_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const saveMedicalID = (medicalID: MedicalID) => {
  localStorage.setItem(MEDICAL_ID_KEY, JSON.stringify(medicalID));
};

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const RELATIONSHIPS = ['Family', 'Doctor', 'Friend', 'Neighbor', 'Other'];

export const EmergencyContacts: React.FC = () => {
  // Contacts state
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);

  // Contact form state
  const [formName, setFormName] = useState('');
  const [formRelationship, setFormRelationship] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formIsPrimary, setFormIsPrimary] = useState(false);
  const [formNotes, setFormNotes] = useState('');

  // Medical ID state
  const [medicalID, setMedicalID] = useState<MedicalID | null>(null);
  const [showMedicalForm, setShowMedicalForm] = useState(false);

  // Medical ID form state
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState('');
  const [medications, setMedications] = useState<string[]>([]);
  const [newMedication, setNewMedication] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [newCondition, setNewCondition] = useState('');
  const [organDonor, setOrganDonor] = useState(false);
  const [emergencyNotes, setEmergencyNotes] = useState('');

  // Load data on mount
  useEffect(() => {
    setContacts(loadContacts());
    const savedMedicalID = loadMedicalID();
    if (savedMedicalID) {
      setMedicalID(savedMedicalID);
    }
  }, []);

  // Get primary contact
  const primaryContact = contacts.find(c => c.isPrimary);

  // Contact form handlers
  const resetContactForm = () => {
    setFormName('');
    setFormRelationship('');
    setFormPhone('');
    setFormEmail('');
    setFormIsPrimary(false);
    setFormNotes('');
    setEditingContact(null);
  };

  const openEditContact = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setFormName(contact.name);
    setFormRelationship(contact.relationship);
    setFormPhone(contact.phone);
    setFormEmail(contact.email || '');
    setFormIsPrimary(contact.isPrimary);
    setFormNotes(contact.notes || '');
    setShowContactForm(true);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || !formPhone.trim() || !formRelationship) {
      toast.error('Please fill in all required fields');
      return;
    }

    let updatedContacts: EmergencyContact[];

    if (editingContact) {
      // Update existing contact
      updatedContacts = contacts.map(c => {
        if (c.id === editingContact.id) {
          return {
            ...c,
            name: formName.trim(),
            relationship: formRelationship,
            phone: formPhone.trim(),
            email: formEmail.trim() || undefined,
            isPrimary: formIsPrimary,
            notes: formNotes.trim() || undefined,
          };
        }
        // If this contact is being set as primary, unset others
        if (formIsPrimary && c.isPrimary) {
          return { ...c, isPrimary: false };
        }
        return c;
      });
      toast.success('Contact updated successfully');
    } else {
      // Add new contact
      const newContact: EmergencyContact = {
        id: generateId(),
        name: formName.trim(),
        relationship: formRelationship,
        phone: formPhone.trim(),
        email: formEmail.trim() || undefined,
        isPrimary: formIsPrimary,
        notes: formNotes.trim() || undefined,
      };

      // If new contact is primary, unset others
      if (formIsPrimary) {
        updatedContacts = contacts.map(c => ({ ...c, isPrimary: false }));
        updatedContacts.push(newContact);
      } else {
        updatedContacts = [...contacts, newContact];
      }
      toast.success('Contact added successfully');
    }

    saveContacts(updatedContacts);
    setContacts(updatedContacts);
    setShowContactForm(false);
    resetContactForm();
  };

  const handleDeleteContact = (id: string) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      const updatedContacts = contacts.filter(c => c.id !== id);
      saveContacts(updatedContacts);
      setContacts(updatedContacts);
      toast.success('Contact deleted');
    }
  };

  const togglePrimary = (id: string) => {
    const updatedContacts = contacts.map(c => ({
      ...c,
      isPrimary: c.id === id ? !c.isPrimary : false,
    }));
    saveContacts(updatedContacts);
    setContacts(updatedContacts);
    toast.success('Primary contact updated');
  };

  // Medical ID form handlers
  const openMedicalForm = () => {
    if (medicalID) {
      setBloodType(medicalID.bloodType);
      setAllergies(medicalID.allergies);
      setMedications(medicalID.medications);
      setConditions(medicalID.conditions);
      setOrganDonor(medicalID.organDonor);
      setEmergencyNotes(medicalID.emergencyNotes);
    }
    setShowMedicalForm(true);
  };

  const handleAddTag = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    list: string[],
    listSetter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (value.trim() && !list.includes(value.trim())) {
      listSetter([...list, value.trim()]);
      setter('');
    }
  };

  const handleRemoveTag = (
    value: string,
    list: string[],
    listSetter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    listSetter(list.filter(item => item !== value));
  };

  const handleMedicalIDSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newMedicalID: MedicalID = {
      bloodType,
      allergies,
      medications,
      conditions,
      organDonor,
      emergencyNotes: emergencyNotes.trim(),
    };

    saveMedicalID(newMedicalID);
    setMedicalID(newMedicalID);
    setShowMedicalForm(false);
    toast.success('Medical ID saved successfully');
  };

  return (
    <div className="space-y-8">
      {/* SOS Section */}
      <div className="bg-gradient-to-br from-rose-500/20 to-red-600/10 backdrop-blur-sm border border-rose-500/30 rounded-2xl p-5 sm:p-8">
        <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className="p-3 sm:p-4 bg-rose-500/20 rounded-xl sm:rounded-2xl border border-rose-500/30">
            <ShieldAlert className="w-6 h-6 sm:w-8 sm:h-8 text-rose-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Emergency SOS</h2>
            <p className="text-rose-200/70 text-xs sm:text-sm">In an emergency, call immediately</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* National Emergency */}
          <a
            href="tel:112"
            className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-rose-600/30 hover:bg-rose-600/40 border border-rose-500/40 rounded-xl transition-all duration-300 group"
          >
            <div className="p-2.5 sm:p-3 bg-rose-500/30 rounded-xl group-hover:bg-rose-500/40 transition-colors">
              <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-xl sm:text-2xl block">112</span>
              <span className="text-rose-200/70 text-xs sm:text-sm">National Emergency</span>
            </div>
          </a>

          {/* Ambulance */}
          <a
            href="tel:102"
            className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 rounded-xl transition-all duration-300 group"
          >
            <div className="p-2.5 sm:p-3 bg-rose-500/20 rounded-xl group-hover:bg-rose-500/30 transition-colors">
              <Ambulance className="w-5 h-5 sm:w-6 sm:h-6 text-rose-300" />
            </div>
            <div>
              <span className="text-white font-bold text-xl sm:text-2xl block">102</span>
              <span className="text-rose-200/60 text-xs sm:text-sm">Ambulance</span>
            </div>
          </a>

          {/* Primary Contact Quick Dial */}
          {primaryContact ? (
            <a
              href={`tel:${primaryContact.phone}`}
              className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] rounded-xl transition-all duration-300 group"
            >
              <div className="p-2.5 sm:p-3 bg-teal-500/20 rounded-xl group-hover:bg-teal-500/30 transition-colors">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-white font-semibold block truncate text-sm sm:text-base">{primaryContact.name}</span>
                <span className="text-white/50 text-xs sm:text-sm">{primaryContact.phone}</span>
              </div>
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0" />
            </a>
          ) : (
            <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-white/[0.03] border border-dashed border-white/[0.10] rounded-xl">
              <div className="p-2.5 sm:p-3 bg-white/[0.04] rounded-xl">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-white/30" />
              </div>
              <div>
                <span className="text-white/40 font-medium block text-sm sm:text-base">No Primary Contact</span>
                <span className="text-white/30 text-xs sm:text-sm">Add one below</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Contacts Section */}
      <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/15 rounded-xl">
              <User className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white">Emergency Contacts</h3>
              <p className="text-white/40 text-xs sm:text-sm">{contacts.length} contact{contacts.length !== 1 ? 's' : ''} saved</p>
            </div>
          </div>
          <Button
            onClick={() => { resetContactForm(); setShowContactForm(true); }}
            className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl px-4 sm:px-5 py-2 sm:py-2.5 h-auto font-medium shadow-lg shadow-teal-600/20 text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>

        {/* Contact Form */}
        {showContactForm && (
          <div className="px-4 sm:px-8 py-5 sm:py-6 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-white font-medium">{editingContact ? 'Edit Contact' : 'Add New Contact'}</h4>
              <VoiceInputButton
                onTranscript={(text) => {
                  // Try to parse name and phone from transcript
                  const phoneMatch = text.match(/[\d\s\-\+]{10,}/);
                  const words = text.split(/\s+/);
                  
                  if (phoneMatch) {
                    setFormPhone(phoneMatch[0].trim());
                    // Remove phone from text to get name
                    const namePart = text.replace(phoneMatch[0], '').trim();
                    if (namePart && !formName) setFormName(namePart);
                  } else if (words.length > 0 && !formName) {
                    // If no phone found, assume it's a name
                    setFormName(text);
                  }
                }}
                placeholder="Say name or phone"
                size="sm"
              />
              <button
                onClick={() => { setShowContactForm(false); resetContactForm(); }}
                className="p-2 rounded-lg hover:bg-white/[0.06] text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleContactSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Name <span className="text-rose-400">*</span></label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Contact name"
                      className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-white/30 focus:border-teal-500/50 h-11"
                      required
                    />
                    <VoiceInputButton
                      onTranscript={(text) => setFormName(text)}
                      placeholder="Say name"
                      size="sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Relationship <span className="text-rose-400">*</span></label>
                  <Select value={formRelationship} onValueChange={setFormRelationship} required>
                    <SelectTrigger className="bg-white/[0.04] border border-white/[0.08] rounded-lg text-white h-11">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIPS.map(rel => (
                        <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Phone <span className="text-rose-400">*</span></label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="tel"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-white/30 focus:border-teal-500/50 h-11"
                      required
                    />
                    <VoiceInputButton
                      onTranscript={(text) => {
                        // Extract phone number digits
                        const digits = text.replace(/\D/g, '');
                        if (digits.length >= 10) setFormPhone(digits);
                      }}
                      placeholder="Say phone"
                      size="sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Email <span className="text-white/30">(optional)</span></label>
                  <Input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-white/30 focus:border-teal-500/50 h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">Notes <span className="text-white/30">(optional)</span></label>
                <Input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  className="bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-white/30 focus:border-teal-500/50 h-11"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formIsPrimary}
                    onCheckedChange={setFormIsPrimary}
                    className="data-[state=checked]:bg-amber-500"
                  />
                  <label className="text-sm text-white/70">Set as primary contact</label>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setShowContactForm(false); resetContactForm(); }}
                    className="bg-white/[0.04] hover:bg-white/[0.08] text-white/70 border-white/[0.08] rounded-xl h-11 px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl h-11 px-6"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {editingContact ? 'Update' : 'Save'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Contacts List */}
        <div className="p-4 sm:p-8">
          {contacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`relative p-5 rounded-xl border transition-all duration-300 hover:bg-white/[0.02] ${
                    contact.isPrimary
                      ? 'bg-amber-500/[0.06] border-amber-500/30'
                      : 'bg-white/[0.02] border-white/[0.06]'
                  }`}
                >
                  {contact.isPrimary && (
                    <div className="absolute top-3 right-3">
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${contact.isPrimary ? 'bg-amber-500/20' : 'bg-white/[0.06]'}`}>
                      <User className={`w-5 h-5 ${contact.isPrimary ? 'text-amber-400' : 'text-white/60'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-medium truncate">{contact.name}</h4>
                        <Badge className="bg-white/[0.08] text-white/60 border-white/[0.10] rounded-full px-2 py-0.5 text-xs">
                          {contact.relationship}
                        </Badge>
                      </div>
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-2 text-teal-400 hover:text-teal-300 text-sm mb-1 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {contact.phone}
                      </a>
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-2 text-white/50 hover:text-white/70 text-sm transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          {contact.email}
                        </a>
                      )}
                      {contact.notes && (
                        <p className="text-white/40 text-sm mt-2 line-clamp-2">{contact.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/[0.06]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePrimary(contact.id)}
                      className={`flex-1 h-9 rounded-lg text-xs ${
                        contact.isPrimary
                          ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                          : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      {contact.isPrimary ? <StarOff className="w-3.5 h-3.5 mr-1.5" /> : <Star className="w-3.5 h-3.5 mr-1.5" />}
                      {contact.isPrimary ? 'Remove Primary' : 'Set Primary'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditContact(contact)}
                      className="bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white rounded-lg h-9 w-9"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteContact(contact.id)}
                      className="bg-white/[0.04] hover:bg-red-500/20 text-white/50 hover:text-red-400 rounded-lg h-9 w-9"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-5">
                <User className="w-10 h-10 text-white/20" />
              </div>
              <h4 className="text-white font-medium mb-2">No emergency contacts yet</h4>
              <p className="text-white/40 text-sm mb-6 max-w-sm mx-auto">
                Add your first emergency contact to ensure quick access during emergencies
              </p>
              <Button
                onClick={() => { resetContactForm(); setShowContactForm(true); }}
                className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl px-6 py-3 h-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Contact
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Medical ID Section */}
      <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/15 rounded-xl">
              <Heart className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white">Medical ID</h3>
              <p className="text-white/40 text-xs sm:text-sm">Critical health information for emergencies</p>
            </div>
          </div>
          <Button
            onClick={openMedicalForm}
            variant="ghost"
            className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 rounded-xl px-4 sm:px-5 py-2 sm:py-2.5 h-auto text-sm sm:text-base w-full sm:w-auto"
          >
            <Edit className="w-4 h-4 mr-2" />
            {medicalID ? 'Edit' : 'Setup'}
          </Button>
        </div>

        {/* Medical ID Form */}
        {showMedicalForm && (
          <div className="px-4 sm:px-8 py-5 sm:py-6 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-white font-medium">Edit Medical ID</h4>
              <button
                onClick={() => setShowMedicalForm(false)}
                className="p-2 rounded-lg hover:bg-white/[0.06] text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleMedicalIDSubmit} className="space-y-6">
              {/* Blood Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-rose-400" />
                  Blood Type
                </label>
                <Select value={bloodType} onValueChange={setBloodType}>
                  <SelectTrigger className="bg-white/[0.04] border border-white/[0.08] rounded-lg text-white h-11 w-full sm:w-48">
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Allergies */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Allergies
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    placeholder="Add allergy (e.g., Penicillin)"
                    className="bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-white/30 focus:border-teal-500/50 h-11 flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag(newAllergy, setNewAllergy, allergies, setAllergies))}
                  />
                  <Button
                    type="button"
                    onClick={() => handleAddTag(newAllergy, setNewAllergy, allergies, setAllergies)}
                    className="bg-white/[0.06] hover:bg-white/[0.10] text-white rounded-lg h-11 px-4"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {allergies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {allergies.map((allergy, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-full text-sm"
                      >
                        {allergy}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(allergy, allergies, setAllergies)}
                          className="hover:text-amber-200 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Medications */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-blue-400" />
                  Current Medications
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newMedication}
                    onChange={(e) => setNewMedication(e.target.value)}
                    placeholder="Add medication"
                    className="bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-white/30 focus:border-teal-500/50 h-11 flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag(newMedication, setNewMedication, medications, setMedications))}
                  />
                  <Button
                    type="button"
                    onClick={() => handleAddTag(newMedication, setNewMedication, medications, setMedications)}
                    className="bg-white/[0.06] hover:bg-white/[0.10] text-white rounded-lg h-11 px-4"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {medications.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {medications.map((med, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-full text-sm"
                      >
                        {med}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(med, medications, setMedications)}
                          className="hover:text-blue-200 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Medical Conditions */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  Medical Conditions
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    placeholder="Add condition (e.g., Diabetes)"
                    className="bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-white/30 focus:border-teal-500/50 h-11 flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag(newCondition, setNewCondition, conditions, setConditions))}
                  />
                  <Button
                    type="button"
                    onClick={() => handleAddTag(newCondition, setNewCondition, conditions, setConditions)}
                    className="bg-white/[0.06] hover:bg-white/[0.10] text-white rounded-lg h-11 px-4"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {conditions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {conditions.map((cond, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/15 text-purple-400 border border-purple-500/30 rounded-full text-sm"
                      >
                        {cond}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(cond, conditions, setConditions)}
                          className="hover:text-purple-200 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Organ Donor */}
              <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div className="flex items-center gap-3">
                  <Stethoscope className="w-5 h-5 text-emerald-400" />
                  <div>
                    <span className="text-white font-medium block">Organ Donor</span>
                    <span className="text-white/40 text-sm">Registered as an organ donor</span>
                  </div>
                </div>
                <Switch
                  checked={organDonor}
                  onCheckedChange={setOrganDonor}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>

              {/* Emergency Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-white/50" />
                  Emergency Notes
                </label>
                <textarea
                  value={emergencyNotes}
                  onChange={(e) => setEmergencyNotes(e.target.value)}
                  placeholder="Any additional information for first responders..."
                  rows={3}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-white/30 focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/20 p-3 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMedicalForm(false)}
                  className="bg-white/[0.04] hover:bg-white/[0.08] text-white/70 border-white/[0.08] rounded-xl h-11 px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white rounded-xl h-11"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Save Medical ID
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Medical ID Display */}
        <div className="p-4 sm:p-8">
          {medicalID && (medicalID.bloodType || medicalID.allergies.length > 0 || medicalID.medications.length > 0 || medicalID.conditions.length > 0) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Blood Type */}
              {medicalID.bloodType && (
                <div className="p-5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                  <div className="flex items-center gap-2 text-white/50 text-sm mb-3">
                    <Droplet className="w-4 h-4 text-rose-400" />
                    Blood Type
                  </div>
                  <span className="text-4xl font-bold text-rose-400">{medicalID.bloodType}</span>
                </div>
              )}

              {/* Organ Donor Status */}
              <div className="p-5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div className="flex items-center gap-2 text-white/50 text-sm mb-3">
                  <Stethoscope className="w-4 h-4 text-emerald-400" />
                  Organ Donor
                </div>
                <span className={`text-2xl font-bold ${medicalID.organDonor ? 'text-emerald-400' : 'text-white/40'}`}>
                  {medicalID.organDonor ? 'Yes' : 'No'}
                </span>
              </div>

              {/* Allergies */}
              {medicalID.allergies.length > 0 && (
                <div className="p-5 bg-white/[0.02] border border-white/[0.06] rounded-xl md:col-span-2">
                  <div className="flex items-center gap-2 text-white/50 text-sm mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Allergies
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {medicalID.allergies.map((allergy, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-full text-sm font-medium"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Medications */}
              {medicalID.medications.length > 0 && (
                <div className="p-5 bg-white/[0.02] border border-white/[0.06] rounded-xl md:col-span-2">
                  <div className="flex items-center gap-2 text-white/50 text-sm mb-3">
                    <Pill className="w-4 h-4 text-blue-400" />
                    Current Medications
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {medicalID.medications.map((med, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-full text-sm font-medium"
                      >
                        {med}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Conditions */}
              {medicalID.conditions.length > 0 && (
                <div className="p-5 bg-white/[0.02] border border-white/[0.06] rounded-xl md:col-span-2">
                  <div className="flex items-center gap-2 text-white/50 text-sm mb-3">
                    <Activity className="w-4 h-4 text-purple-400" />
                    Medical Conditions
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {medicalID.conditions.map((cond, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-purple-500/15 text-purple-400 border border-purple-500/30 rounded-full text-sm font-medium"
                      >
                        {cond}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Emergency Notes */}
              {medicalID.emergencyNotes && (
                <div className="p-5 bg-white/[0.02] border border-white/[0.06] rounded-xl md:col-span-2">
                  <div className="flex items-center gap-2 text-white/50 text-sm mb-3">
                    <FileText className="w-4 h-4 text-white/50" />
                    Emergency Notes
                  </div>
                  <p className="text-white/80 leading-relaxed">{medicalID.emergencyNotes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Heart className="w-10 h-10 text-rose-400/40" />
              </div>
              <h4 className="text-white font-medium mb-2">No Medical ID configured</h4>
              <p className="text-white/40 text-sm mb-6 max-w-sm mx-auto">
                Add your blood type, allergies, medications, and medical conditions for emergency responders
              </p>
              <Button
                onClick={openMedicalForm}
                className="bg-rose-600 hover:bg-rose-500 text-white rounded-xl px-6 py-3 h-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Setup Medical ID
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyContacts;
