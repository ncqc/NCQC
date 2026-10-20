'use client';
import { useState, useEffect } from 'react';
import { 
  CompetitionForm, 
  FormField, 
  FormFieldType, 
  FormSubmission,
  CompetitionScope,
  PostSubmitConfig
} from '@/data/forms';
import { competitionsData, Competition } from '@/data/competitions';
import { stripStyledText } from '@/utils/styledText';
import {
  getFirebaseForms,
  saveFirebaseForm,
  deleteFirebaseForm,
  getFirebaseSubmissions,
  saveFirebaseSubmission,
  deleteFirebaseSubmission,
  updateFirebaseSubmissionStatus,
  getFirebaseFormLinks,
  saveFirebaseFormLink,
  removeFirebaseFormLink,
  checkFirebaseHealth,
  syncLocalSubmissionsToFirebase
} from '@/lib/firebaseForms';

export default function CompetitionFormsAdmin() {
  const [activeTab, setActiveTab] = useState<'forms' | 'builder' | 'submissions'>('forms');
  const [forms, setForms] = useState<CompetitionForm[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState<boolean>(true);
  const [firebaseRulesWarning, setFirebaseRulesWarning] = useState<boolean>(false);
  const [isSyncingSubmissions, setIsSyncingSubmissions] = useState<boolean>(false);
  
  // Competitions list for linking & filtering
  const [competitionsList, setCompetitionsList] = useState<Competition[]>(competitionsData);
  const [selectedCompetitionSlug, setSelectedCompetitionSlug] = useState<string>('');

  // Submissions filters (Image 2 Features)
  const [filterCompetition, setFilterCompetition] = useState<string>('all');
  const [filterScope, setFilterScope] = useState<'all' | CompetitionScope>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Builder form state
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('PIXELEON \'26 | Submissions');
  const [formDescription, setFormDescription] = useState('Blend artistic vision with technical precision to craft visual masterpieces. Bring abstract concepts to life through composition, color, and typography, giving shape to thought and inspiring audiences through the digital medium.');
  const [formScope, setFormScope] = useState<CompetitionScope>('inter-school');
  const [formCategory, setFormCategory] = useState<string>('Senior (Grade 10 - 13)');
  const [accentColor, setAccentColor] = useState<string>('#dc2626');
  const [limitOneResponse, setLimitOneResponse] = useState<boolean>(true);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formDeadline, setFormDeadline] = useState<string>('');
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [whatsappGroupLink, setWhatsappGroupLink] = useState<string>('');
  const [whatsappGroupLabel, setWhatsappGroupLabel] = useState<string>('Join Official WhatsApp Group');
  const [customSuccessNotice, setCustomSuccessNotice] = useState<string>('');
  const [formFields, setFormFields] = useState<FormField[]>([]);
  
  // Builder field options temporary typing buffer (solves comma bug completely)
  const [optionsInputBuffer, setOptionsInputBuffer] = useState<Record<string, string>>({});

  // Preview & Modal states
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({});
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Initialize and load from Firebase Cloud Database
  useEffect(() => {
    // 1. Load latest competitions from API
    fetch('/api/competitions')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data && d.data.length > 0) {
          setCompetitionsList(d.data);
        }
      })
      .catch(() => {});

    // 2. Fetch Forms directly from Firebase Cloud Database
    setIsFirebaseSyncing(true);
    getFirebaseForms().then(fetchedForms => {
      if (fetchedForms) {
        setForms(fetchedForms);
      }
    }).finally(() => {
      setIsFirebaseSyncing(false);
    });

    // 3. Fetch Submissions directly from Firebase Cloud Database
    getFirebaseSubmissions().then(fetchedSubs => {
      if (fetchedSubs) {
        setSubmissions(fetchedSubs);
      }
    });

    // 4. Load form links mapping
    getFirebaseFormLinks().catch(() => {});

    // 5. Check Firebase Security Rules status
    checkFirebaseHealth().then(health => {
      setFirebaseRulesWarning(health.rulesLocked);
    });

    // 6. Listen for live submissions from current window
    const handleLiveSubmission = (e: any) => {
      if (e.detail) {
        setSubmissions(prev => {
          const filtered = prev.filter(s => s.id !== e.detail.id);
          return [e.detail, ...filtered];
        });
      }
    };
    window.addEventListener('ncqc_submission_saved', handleLiveSubmission);
    return () => {
      window.removeEventListener('ncqc_submission_saved', handleLiveSubmission);
    };
  }, []);

  const handleBulkSync = async () => {
    setIsSyncingSubmissions(true);
    try {
      const res = await syncLocalSubmissionsToFirebase();
      const latest = await getFirebaseSubmissions();
      setSubmissions(latest);
      const health = await checkFirebaseHealth();
      setFirebaseRulesWarning(health.rulesLocked);
      if (health.rulesLocked) {
        alert('⚠️ Firebase rules are currently set to "if false;". Please change rules to "allow read, write: if true;" in Firebase Console to sync online.');
      } else {
        showNotification(`✅ Successfully synced ${res.success} submissions to Firebase Cloud!`);
      }
    } catch {
      showNotification('Error syncing submissions to Firebase.');
    } finally {
      setIsSyncingSubmissions(false);
    }
  };

  const persistForms = (newForms: CompetitionForm[]) => {
    setForms(newForms);
  };

  const persistSubmissions = (newSubs: FormSubmission[]) => {
    setSubmissions(newSubs);
  };

  const showNotification = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 4000);
  };

  // Start designing a new form
  const handleStartNewForm = () => {
    setEditingFormId(null);
    setFormTitle('PIXELEON \'26 | Submissions');
    setFormDescription('Blend artistic vision with technical precision to craft visual masterpieces. Bring abstract concepts to life through composition, color, and typography.');
    setFormScope('inter-school');
    setFormCategory('Senior (Grade 10 - 13)');
    setAccentColor('#dc2626');
    setLimitOneResponse(true);
    setFormIsActive(true);
    setFormDeadline('');
    setSelectedCompetitionSlug('');
    setIsStandalone(false);
    setWhatsappGroupLink('');
    setWhatsappGroupLabel('Join Official WhatsApp Group');
    setCustomSuccessNotice('');
    
    // Default crisp fields (matching Image 2)
    const initialFields: FormField[] = [
      { id: 'f_email_' + Date.now(), label: 'Email Address', type: 'email', placeholder: 'you@example.com', required: true, helpText: 'This form is limited to 1 response per email.' },
      { id: 'f_name_' + (Date.now() + 1), label: 'Name', type: 'text', placeholder: 'Enter your full name', required: true },
      { id: 'f_grade_' + (Date.now() + 2), label: 'Grade', type: 'text', placeholder: 'e.g. Grade 11', required: true },
      { id: 'f_school_' + (Date.now() + 3), label: 'School Name', type: 'text', placeholder: 'Enter school name', required: true },
      { id: 'f_cat_' + (Date.now() + 4), label: 'Category Selection', type: 'select', placeholder: 'Choose category...', required: true, options: ['Senior Category', 'Junior Category', 'Open Category'] }
    ];
    setFormFields(initialFields);

    const buffers: Record<string, string> = {};
    initialFields.forEach(f => {
      if (f.options) buffers[f.id] = f.options.join(', ');
    });
    setOptionsInputBuffer(buffers);

    setActiveTab('builder');
  };

  // Edit existing form
  const handleEditForm = (form: CompetitionForm) => {
    setEditingFormId(form.id);
    setFormTitle(form.title);
    setFormDescription(form.description);
    setFormScope(form.scope || 'inter-school');
    setFormCategory(form.category || 'Senior (Grade 10 - 13)');
    setAccentColor(form.accentColor || '#dc2626');
    setLimitOneResponse(form.limitOneResponse !== false);
    setFormIsActive(form.isActive);
    setFormDeadline(form.deadline || '');
    setIsStandalone(form.isStandalone || false);
    setSelectedCompetitionSlug(form.isStandalone ? '__standalone__' : (form.competitionSlug || ''));
    setWhatsappGroupLink(form.postSubmitConfig?.whatsappGroupLink || '');
    setWhatsappGroupLabel(form.postSubmitConfig?.whatsappGroupLabel || 'Join Official WhatsApp Group');
    setCustomSuccessNotice(form.postSubmitConfig?.customNotice || '');
    setFormFields([...(form.fields || [])]);

    const buffers: Record<string, string> = {};
    (form.fields || []).forEach(f => {
      if (f.options) buffers[f.id] = f.options.join(', ');
    });
    setOptionsInputBuffer(buffers);

    setActiveTab('builder');
  };

  // Delete form permanently from Firebase Realtime Database
  // Delete form permanently from Firebase Cloud Database
  const handleDeleteForm = async (id: string) => {
    if (confirm('Are you sure you want to delete this custom form? It will be permanently removed from Firebase Cloud Database.')) {
      setForms(prev => prev.filter(f => f.id !== id));
      await deleteFirebaseForm(id);
      const latest = await getFirebaseForms();
      setForms(latest);
      showNotification('Form permanently deleted from Firebase Database.');
    }
  };

  // Delete submission permanently from Firebase Cloud Database
  const handleDeleteSubmission = async (id: string) => {
    if (confirm('Are you sure you want to delete this candidate submission? It will be permanently removed from Firebase Cloud Database.')) {
      setSubmissions(prev => prev.filter(s => s.id !== id));
      setSelectedSubmission(null);
      await deleteFirebaseSubmission(id);
      const latest = await getFirebaseSubmissions();
      setSubmissions(latest);
      showNotification('Submission permanently deleted from Firebase Database.');
    }
  };

  // Update submission status in Firebase Cloud Database
  const handleUpdateSubmissionStatus = async (id: string, newStatus: 'confirmed' | 'rejected' | 'pending') => {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    if (selectedSubmission && selectedSubmission.id === id) {
      setSelectedSubmission({ ...selectedSubmission, status: newStatus });
    }
    await updateFirebaseSubmissionStatus(id, newStatus);
    const latest = await getFirebaseSubmissions();
    setSubmissions(latest);
    showNotification(`Status updated to ${newStatus.toUpperCase()} in Firebase.`);
  };

  // Add field to builder
  const handleAddField = (type: FormFieldType = 'text') => {
    const isEmail = type === 'email';
    const isTeam = type === 'team-members';
    const isSelectable = ['select', 'radio', 'checkbox'].includes(type);
    const newId = 'field_' + Date.now();
    const defaultOptions = isSelectable ? ['Option 1', 'Option 2', 'Option 3'] : undefined;

    const newField: FormField = {
      id: newId,
      label: isEmail ? 'Email Address' : isTeam ? 'Team Squad / Members' : type === 'file' ? 'Upload Document / Slip' : isSelectable ? 'Select Category' : 'New Question Field',
      type: type,
      placeholder: isEmail ? 'you@example.com' : isTeam ? undefined : 'Enter answer here...',
      required: true,
      helpText: isEmail ? 'This form is limited to 1 response per email.' : isTeam ? 'Specify all members of your quiz team squad.' : undefined,
      options: defaultOptions,
      teamConfig: isTeam ? { memberCount: 4, includeGrade: true, includePhone: true } : undefined
    };

    setFormFields([...formFields, newField]);

    if (defaultOptions) {
      setOptionsInputBuffer(prev => ({ ...prev, [newId]: defaultOptions.join(', ') }));
    }
  };

  // Handle options typing buffer (prevents commas from disappearing while typing!)
  const handleOptionsBufferChange = (fieldId: string, rawText: string, fieldIndex: number) => {
    setOptionsInputBuffer(prev => ({ ...prev, [fieldId]: rawText }));
    const parsedOptions = rawText.split(',').map(s => s.trim()).filter(Boolean);
    const updated = [...formFields];
    updated[fieldIndex] = { ...updated[fieldIndex], options: parsedOptions };
    setFormFields(updated);
  };

  // Add a quick chip option
  const handleAddOptionChip = (fieldIndex: number, fieldId: string, optionText: string) => {
    if (!optionText.trim()) return;
    const currentOptions = formFields[fieldIndex].options || [];
    const nextOptions = [...currentOptions, optionText.trim()];
    const updated = [...formFields];
    updated[fieldIndex] = { ...updated[fieldIndex], options: nextOptions };
    setFormFields(updated);
    setOptionsInputBuffer(prev => ({ ...prev, [fieldId]: nextOptions.join(', ') }));
  };

  // Remove single chip option
  const handleRemoveOptionChip = (fieldIndex: number, fieldId: string, optIndex: number) => {
    const currentOptions = formFields[fieldIndex].options || [];
    const nextOptions = currentOptions.filter((_, oi) => oi !== optIndex);
    const updated = [...formFields];
    updated[fieldIndex] = { ...updated[fieldIndex], options: nextOptions };
    setFormFields(updated);
    setOptionsInputBuffer(prev => ({ ...prev, [fieldId]: nextOptions.join(', ') }));
  };

  // Field updates
  const handleUpdateField = (index: number, updates: Partial<FormField>) => {
    const updated = [...formFields];
    updated[index] = { ...updated[index], ...updates };
    setFormFields(updated);
  };

  // Remove field
  const handleRemoveField = (index: number) => {
    setFormFields(formFields.filter((_, i) => i !== index));
  };

  // Move field up/down
  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === formFields.length - 1) return;
    const target = direction === 'up' ? index - 1 : index + 1;
    const updated = [...formFields];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setFormFields(updated);
  };

  // Save the form directly to Firebase Cloud Database (Firestore)
  const handleSaveForm = async () => {
    if (!formTitle.trim()) {
      alert('Please enter a Form Title!');
      return;
    }
    if (formFields.length === 0) {
      alert('Please add at least one question field to the form!');
      return;
    }

    const isStandaloneForm = isStandalone || selectedCompetitionSlug === '__standalone__';
    const compSlugToSave = isStandaloneForm ? undefined : (selectedCompetitionSlug || undefined);

    const linkedComp = compSlugToSave ? competitionsList.find(c => c.slug === compSlugToSave) : undefined;
    const linkedCompTitle = linkedComp ? stripStyledText(linkedComp.title) : undefined;
    const savedFormId = editingFormId || ('form_' + Date.now());

    const postSubmitConfig: PostSubmitConfig = {
      whatsappGroupLink: whatsappGroupLink.trim() || undefined,
      whatsappGroupLabel: whatsappGroupLabel.trim() || 'Join Official WhatsApp Group',
      customNotice: customSuccessNotice.trim() || undefined
    };

    setIsFirebaseSyncing(true);

    if (editingFormId) {
      const existing = forms.find(f => f.id === editingFormId);
      const updatedForm: CompetitionForm = {
        ...(existing || forms[0]),
        id: editingFormId,
        slug: existing?.slug || formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `form-${Date.now()}`,
        title: formTitle,
        description: formDescription,
        scope: formScope,
        category: formCategory,
        accentColor: accentColor,
        limitOneResponse: limitOneResponse,
        isActive: formIsActive,
        deadline: formDeadline,
        fields: formFields,
        isStandalone: isStandaloneForm,
        competitionSlug: compSlugToSave,
        competitionTitle: linkedCompTitle,
        postSubmitConfig: postSubmitConfig
      };

      // Save directly to Firebase Cloud Database
      await saveFirebaseForm(updatedForm);
      if (compSlugToSave) {
        await saveFirebaseFormLink(compSlugToSave, savedFormId).catch(() => {});
      }

      const latestForms = await getFirebaseForms();
      setForms(latestForms);
      setIsFirebaseSyncing(false);

      showNotification(isStandaloneForm
        ? `Standalone form updated in Firebase! Accessible at /forms/${updatedForm.slug}`
        : compSlugToSave 
          ? `Form updated and linked to "${linkedCompTitle}" in Firebase Database!` 
          : 'Form updated in Firebase Database!');
    } else {
      const formSlug = formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `form-${Date.now()}`;
      const newForm: CompetitionForm = {
        id: savedFormId,
        slug: formSlug,
        title: formTitle,
        description: formDescription,
        scope: formScope,
        category: formCategory,
        accentColor: accentColor,
        limitOneResponse: limitOneResponse,
        isActive: formIsActive,
        deadline: formDeadline,
        fields: formFields,
        isStandalone: isStandaloneForm,
        competitionSlug: compSlugToSave,
        competitionTitle: linkedCompTitle,
        postSubmitConfig: postSubmitConfig,
        createdAt: new Date().toISOString().split('T')[0]
      };

      // Save directly to Firebase Cloud Database
      await saveFirebaseForm(newForm);
      if (compSlugToSave) {
        await saveFirebaseFormLink(compSlugToSave, savedFormId).catch(() => {});
      }

      const latestForms = await getFirebaseForms();
      setForms(latestForms);
      setIsFirebaseSyncing(false);

      showNotification(isStandaloneForm
        ? `New standalone form published to Firebase! Public link: /forms/${formSlug}`
        : compSlugToSave 
          ? `New custom form created and saved to Firebase for "${linkedCompTitle}"!` 
          : 'New custom form saved to Firebase Database!');
    }

    setActiveTab('forms');
  };

  // Test submit
  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const linkedComp = competitionsList.find(c => c.slug === selectedCompetitionSlug);
    const linkedCompTitle = linkedComp ? stripStyledText(linkedComp.title) : undefined;
    const testRef = `REG-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newSub: FormSubmission = {
      id: testRef,
      referralId: testRef,
      formId: editingFormId || 'active-form',
      formTitle: formTitle,
      scope: formScope,
      category: formCategory,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'confirmed',
      data: { 
        ...previewAnswers,
        'Referral ID': testRef,
        'Registration ID': testRef,
        ...(selectedCompetitionSlug ? { 'Target Competition': linkedCompTitle || selectedCompetitionSlug } : {})
      }
    };

    await saveFirebaseSubmission(newSub);
    const latestSubs = await getFirebaseSubmissions();
    setSubmissions(latestSubs);
    alert(`🎉 Registration Recorded Successfully!\n\nReferral ID: ${testRef}\n\nThis entry has been automatically saved to Firebase Database and routed to the Submissions Hub!`);
    setPreviewAnswers({});
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter(sub => {
    const rawQ = searchQuery.trim();
    const q = rawQ.toLowerCase();
    
    // Normalize IDs for ultra-resilient matching (e.g. "REG-2026-492193", "492193", "reg 2026")
    const subId = (sub.id || '').toLowerCase();
    const subRef = ((sub as any).referralId || '').toLowerCase();
    const qClean = q.replace(/[^a-z0-9]/gi, '');
    const idClean = subId.replace(/[^a-z0-9]/gi, '');
    
    // Exact or partial ID / referral match
    const isIdMatch = q !== '' && (
      subId.includes(q) || 
      subRef.includes(q) || 
      (qClean.length >= 3 && idClean.includes(qClean))
    );

    // If admin is specifically searching an ID code, surface it immediately even across scope tabs
    if (isIdMatch) {
      return true;
    }

    const matchesScope = filterScope === 'all' || sub.scope === filterScope;
    const matchesCat = filterCategory === 'all' || sub.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    
    // Competition Matching (Image 2 Feature)
    const matchedCompObj = competitionsList.find(c => c.slug === filterCompetition);
    const cleanCompTitle = matchedCompObj ? stripStyledText(matchedCompObj.title).toLowerCase() : '';
    const matchesComp = filterCompetition === 'all' || 
      sub.competitionSlug === filterCompetition ||
      (cleanCompTitle && sub.competitionTitle && sub.competitionTitle.toLowerCase().includes(cleanCompTitle)) ||
      (sub.data && (
        sub.data['Target Competition'] === filterCompetition ||
        sub.data['Attached Competition'] === filterCompetition ||
        (cleanCompTitle && JSON.stringify(sub.data).toLowerCase().includes(cleanCompTitle)) ||
        JSON.stringify(sub.data).toLowerCase().includes(filterCompetition.toLowerCase())
      ));

    const matchesSearch = q === '' || 
      subId.includes(q) ||
      subRef.includes(q) ||
      (sub.formTitle || '').toLowerCase().includes(q) ||
      ((sub as any).competitionTitle || '').toLowerCase().includes(q) ||
      JSON.stringify(sub.data || {}).toLowerCase().includes(q) ||
      JSON.stringify(sub.teamMembers || []).toLowerCase().includes(q);

    return matchesScope && matchesCat && matchesStatus && matchesSearch && matchesComp;
  });

  // Export CSV
  const handleExportCSV = () => {
    if (filteredSubmissions.length === 0) {
      alert('No submissions found to export for the current filters!');
      return;
    }

    const allHeaders = new Set<string>(['Submission ID', 'Tournament Scope', 'Category', 'Form Title', 'Submitted At', 'Status']);
    filteredSubmissions.forEach(sub => {
      Object.keys(sub.data).forEach(k => allHeaders.add(k));
    });

    const headerArray = Array.from(allHeaders);
    const csvRows: string[] = [];
    csvRows.push(headerArray.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

    filteredSubmissions.forEach(sub => {
      const row = headerArray.map(header => {
        let val = '';
        if (header === 'Submission ID') val = sub.id;
        else if (header === 'Tournament Scope') val = sub.scope.toUpperCase();
        else if (header === 'Category') val = sub.category || 'N/A';
        else if (header === 'Form Title') val = sub.formTitle;
        else if (header === 'Submitted At') val = sub.submittedAt;
        else if (header === 'Status') val = sub.status.toUpperCase();
        else val = sub.data[header] !== undefined ? String(sub.data[header]) : '';
        return `"${val.replace(/"/g, '""')}"`;
      });
      csvRows.push(row.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `NCQC_Registrations_${filterScope}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Scope definitions with icons and descriptions
  const scopesList: { id: CompetitionScope; icon: string; name: string; subtitle: string; color: string }[] = [
    { id: 'inter-school', icon: '🏫', name: 'Inter-School', subtitle: 'All-Schools Tournament', color: '#2563eb' },
    { id: 'inner-school', icon: '🏛️', name: 'Inner-School', subtitle: 'Intra-School Contest', color: '#7c3aed' },
    { id: 'all-island-open', icon: '🌐', name: 'All-Island Open', subtitle: 'National Open Championship', color: '#059669' },
    { id: 'invitational', icon: '🤝', name: 'Invitational', subtitle: 'Exclusive Invitational Meet', color: '#d97706' },
    { id: 'online', icon: '⚡', name: 'Online Battle', subtitle: 'Virtual & Digital Contest', color: '#0891b2' }
  ];

  return (
    <div style={{ paddingTop: '1rem', paddingBottom: '5rem', maxWidth: '1480px', margin: '0 auto' }}>
      
      {/* 3D Glassmorphic Header */}
      <header style={{ 
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: '#fff',
        borderRadius: '24px',
        padding: '2.5rem',
        marginBottom: '2.5rem',
        boxShadow: '0 25px 50px -15px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.35rem 0.85rem', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 800, color: '#fca5a5' }}>
              <span>⚡</span> ADVANCED 3D REGISTRATION SUITE
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.18)', border: '1px solid rgba(16, 185, 129, 0.35)', padding: '0.35rem 0.85rem', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 800, color: '#6ee7b7' }}>
              <span>🔥</span> FIREBASE REALTIME DATABASE
            </div>
          </div>
          <h1 style={{ fontSize: '2.3rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
            Competition Forms Studio
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '0.5rem', maxWidth: '680px', lineHeight: 1.6 }}>
            Design high-end custom forms with rich typography, dropdowns, and file uploads. Separate submissions by <strong style={{ color: '#fff' }}>Inter-School</strong>, <strong style={{ color: '#fff' }}>Inner-School</strong>, or <strong style={{ color: '#fff' }}>All-Island Open</strong>.
          </p>
        </div>

        {/* Top Switcher Navigation */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
          <button 
            onClick={() => setActiveTab('forms')}
            style={{ 
              background: activeTab === 'forms' ? '#dc2626' : 'rgba(255,255,255,0.08)', 
              color: '#fff', border: '1px solid rgba(255,255,255,0.12)', padding: '0.85rem 1.4rem', 
              borderRadius: '14px', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: activeTab === 'forms' ? '0 10px 25px rgba(220, 38, 38, 0.45)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <span>📋</span> My Forms ({forms.length})
          </button>

          <button 
            onClick={() => setActiveTab('submissions')}
            style={{ 
              background: activeTab === 'submissions' ? '#dc2626' : 'rgba(255,255,255,0.08)', 
              color: '#fff', border: '1px solid rgba(255,255,255,0.12)', padding: '0.85rem 1.4rem', 
              borderRadius: '14px', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: activeTab === 'submissions' ? '0 10px 25px rgba(220, 38, 38, 0.45)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <span>👥</span> Submissions ({submissions.length})
          </button>

          <button 
            onClick={handleStartNewForm}
            style={{ 
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              color: '#fff', border: 'none', padding: '0.85rem 1.6rem', 
              borderRadius: '14px', fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 10px 25px rgba(239, 68, 68, 0.45)'
            }}
          >
            <span>➕</span> Design New Form
          </button>
        </div>
      </header>

      {/* Notification banner */}
      {statusNotice && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '1rem 1.5rem', borderRadius: '14px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }}>
          <span>✅</span> {statusNotice}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: ALL FORMS VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'forms' && (
        <div>
          {forms.length === 0 ? (
            <div style={{ 
              background: '#fff', borderRadius: '24px', border: '2px dashed #cbd5e1', 
              padding: '5rem 2rem', textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
            }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎨</div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                Your Custom Form Studio is Fresh & Ready!
              </h2>
              <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '520px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
                Click below to start designing your custom registration form with custom fields, dropdowns, and Image 2 styling!
              </p>
              <button 
                onClick={handleStartNewForm}
                style={{ 
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  color: '#fff', border: 'none', padding: '1rem 2.2rem', 
                  borderRadius: '14px', fontWeight: 800, fontSize: '1.05rem', cursor: 'pointer',
                  boxShadow: '0 10px 25px rgba(220, 38, 38, 0.4)'
                }}
              >
                ➕ Create My First Custom Form
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.75rem' }}>
              {forms.map(form => {
                const subCount = submissions.filter(s => s.formId === form.id).length;
                const matchedScope = scopesList.find(s => s.id === form.scope) || scopesList[0];

                return (
                  <div 
                    key={form.id}
                    style={{ 
                      background: '#fff', 
                      borderRadius: '24px', 
                      border: '1px solid #e2e8f0', 
                      padding: '2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 15px 35px -5px rgba(0,0,0,0.06), 0 0 1px 1px rgba(0,0,0,0.03)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: form.accentColor || '#dc2626' }} />

                    <div>
                      {/* Badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <span style={{ 
                          fontSize: '0.78rem', fontWeight: 800, padding: '0.35rem 0.85rem', borderRadius: '100px',
                          background: `${matchedScope.color}15`,
                          color: matchedScope.color,
                          border: `1px solid ${matchedScope.color}35`,
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem'
                        }}>
                          <span>{matchedScope.icon}</span> {matchedScope.name}
                        </span>

                        <span style={{ 
                          fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.75rem', borderRadius: '100px',
                          background: form.isActive ? '#dcfce7' : '#fee2e2',
                          color: form.isActive ? '#15803d' : '#b91c1c'
                        }}>
                          {form.isActive ? '🟢 Active' : '🔴 Closed'}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                        {form.title}
                      </h3>
                      <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.55, marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {form.description}
                      </p>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <span style={{ background: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                          ⚙️ {(form.fields || []).length} Custom Fields
                        </span>
                        <span style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                          📥 {subCount} Submissions
                        </span>
                        {form.category && (
                          <span style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                            🏷️ {form.category}
                          </span>
                        )}
                      </div>

                      {/* Linked Competition Status Badge or Standalone Public Link */}
                      {form.isStandalone ? (
                        <div style={{ 
                          background: '#eff6ff', 
                          border: '1px solid #bfdbfe', 
                          borderRadius: '12px', 
                          padding: '0.65rem 0.85rem', 
                          marginBottom: '1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          fontSize: '0.82rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1e40af', fontWeight: 800 }}>
                            <span>🌐 Public Form:</span>
                            <code style={{ background: '#dbeafe', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.78rem' }}>/forms/{form.slug}</code>
                          </div>
                          <div style={{ display: 'flex', gap: '0.45rem' }}>
                            <a 
                              href={`/forms/${encodeURIComponent(form.slug)}`} 
                              target="_blank" 
                              style={{ color: '#2563eb', fontWeight: 800, textDecoration: 'none', fontSize: '0.78rem', background: '#fff', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid #bfdbfe' }}
                            >
                              Open Form ↗
                            </a>
                            <button 
                              type="button"
                              onClick={() => {
                                const url = `${window.location.origin}/forms/${form.slug}`;
                                navigator.clipboard.writeText(url);
                                showNotification('Public form invitation link copied to clipboard!');
                              }}
                              style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              📋 Copy Link
                            </button>
                          </div>
                        </div>
                      ) : form.competitionSlug ? (
                        <div style={{ 
                          background: '#eff6ff', 
                          border: '1px solid #bfdbfe', 
                          borderRadius: '12px', 
                          padding: '0.65rem 0.85rem', 
                          marginBottom: '1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          fontSize: '0.82rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1e40af', fontWeight: 800 }}>
                            <span>🏆 Linked:</span>
                            <span style={{ color: '#0f172a' }}>{stripStyledText(form.competitionTitle || form.competitionSlug)}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.65rem' }}>
                            <a 
                              href={`/competitions/${encodeURIComponent(form.competitionSlug)}`} 
                              target="_blank" 
                              style={{ color: '#2563eb', fontWeight: 800, textDecoration: 'none', fontSize: '0.78rem' }}
                            >
                              Page ↗
                            </a>
                            <a 
                              href={`/competitions/${encodeURIComponent(form.competitionSlug)}/register`} 
                              target="_blank" 
                              style={{ color: '#dc2626', fontWeight: 800, textDecoration: 'none', fontSize: '0.78rem' }}
                            >
                              Register Form ↗
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div style={{ 
                          background: '#f8fafc', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '12px', 
                          padding: '0.5rem 0.85rem', 
                          marginBottom: '1.25rem',
                          color: '#64748b',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}>
                          <span>⚪ Draft / Not linked to any competition</span>
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleEditForm(form)}
                        style={{ flex: 1, background: '#0f172a', color: '#fff', border: 'none', padding: '0.7rem 1rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                      >
                        ✏️ Edit & Preview
                      </button>

                      <button
                        onClick={() => handleDeleteForm(form.id)}
                        style={{ background: '#fff', color: '#dc2626', border: '1px solid #fee2e2', padding: '0.7rem 0.85rem', borderRadius: '10px', cursor: 'pointer' }}
                        title="Delete Form"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ADVANCED FORM BUILDER (WITH IMAGE 2 EXACT PREVIEW & DROPDOWN FIX) */}
      {/* ========================================================================= */}
      {activeTab === 'builder' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)', gap: '2rem', alignItems: 'start' }}>
          
          {/* BUILDER SETTINGS (LEFT) */}
          <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '2.25rem', boxShadow: '0 15px 35px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {editingFormId ? 'Editing Form' : 'Custom Form Creator'}
                </span>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', margin: '0.2rem 0' }}>
                  Form Design Controls
                </h2>
              </div>

              <button
                type="button"
                onClick={handleSaveForm}
                style={{ 
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', 
                  color: '#fff', border: 'none', padding: '0.75rem 1.75rem', 
                  borderRadius: '12px', fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(220, 38, 38, 0.35)'
                }}
              >
                💾 Save Form
              </button>
            </div>

            {/* Target Competition Scope (5 Expanded Categories with 3D styling - Solves Image 1) */}
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '18px', border: '1px solid #e2e8f0', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e293b' }}>
                  🎯 Target Competition Scope *
                </label>
                <small style={{ color: '#64748b', fontSize: '0.75rem' }}>Select which tournament type this applies to</small>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem' }}>
                {scopesList.map(s => {
                  const isSelected = formScope === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFormScope(s.id)}
                      style={{
                        padding: '0.85rem 0.6rem',
                        borderRadius: '14px',
                        border: isSelected ? `2px solid ${s.color}` : '1px solid #cbd5e1',
                        background: isSelected ? `${s.color}10` : '#ffffff',
                        color: isSelected ? s.color : '#475569',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        textAlign: 'center',
                        boxShadow: isSelected ? `0 6px 15px ${s.color}25` : '0 2px 4px rgba(0,0,0,0.02)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ fontSize: '1.35rem' }}>{s.icon}</span>
                      <span style={{ fontSize: '0.82rem', lineHeight: 1.2 }}>{s.name}</span>
                      <small style={{ fontSize: '0.68rem', fontWeight: 600, color: isSelected ? s.color : '#94a3b8' }}>{s.subtitle}</small>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form General Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  Form Title (Header) *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. PIXELEON '26 | Submissions"
                  style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                  Form Description / Introduction *
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Enter instructions, guidelines, theme details..."
                  style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.9rem', lineHeight: 1.55, resize: 'vertical' }}
                />
              </div>

              {/* Category & Color */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    Competition Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#fff', fontWeight: 600 }}
                  >
                    <option value="Senior (Grade 10 - 13)">Senior (Grade 10 - 13)</option>
                    <option value="Junior (Grade 6 - 9)">Junior (Grade 6 - 9)</option>
                    <option value="Primary (Grade 1 - 5)">Primary (Grade 1 - 5)</option>
                    <option value="Open Category">Open / University / All</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    Theme Accent Color
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {['#dc2626', '#2563eb', '#059669', '#7c3aed', '#d97706'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAccentColor(c)}
                        style={{
                          width: '32px', height: '32px', borderRadius: '50%', background: c, border: accentColor === c ? '3px solid #0f172a' : '2px solid #fff',
                          cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Questions Fields Builder */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  Custom Questions & Fields ({formFields.length})
                </h3>
                <small style={{ color: '#64748b' }}>Customized by you</small>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {formFields.map((field, idx) => {
                  const isSelectable = ['select', 'radio', 'checkbox'].includes(field.type);
                  const isEmail = field.type === 'email';

                  return (
                    <div 
                      key={field.id}
                      style={{ 
                        background: isEmail ? '#fff8f8' : '#ffffff',
                        border: isEmail ? '1px solid #fecaca' : '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '1.35rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.85rem',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: isEmail ? '#991b1b' : '#1e293b' }}>
                          Field {idx + 1} {isEmail ? '• Highlighted Email Card' : `• ${field.type.toUpperCase()}`}
                        </span>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button type="button" onClick={() => handleMoveField(idx, 'up')} disabled={idx === 0} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.25rem 0.55rem', cursor: 'pointer' }}>⬆️</button>
                          <button type="button" onClick={() => handleMoveField(idx, 'down')} disabled={idx === formFields.length - 1} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.25rem 0.55rem', cursor: 'pointer' }}>⬇️</button>
                          <button type="button" onClick={() => handleRemoveField(idx)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', padding: '0.25rem 0.6rem', cursor: 'pointer', fontWeight: 800 }}>🗑️</button>
                        </div>
                      </div>

                      {/* Label and Type */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>Question Label *</label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => handleUpdateField(idx, { label: e.target.value })}
                            placeholder="e.g. School Name / WhatsApp"
                            style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>Input Type</label>
                          <select
                            value={field.type}
                            onChange={(e) => {
                              const newType = e.target.value as FormFieldType;
                              const shouldHaveOptions = ['select', 'radio', 'checkbox'].includes(newType);
                              const isTeam = newType === 'team-members';
                              const options = shouldHaveOptions ? (field.options && field.options.length > 0 ? field.options : ['Option 1', 'Option 2']) : undefined;
                              handleUpdateField(idx, { 
                                type: newType, 
                                options,
                                teamConfig: isTeam ? (field.teamConfig || { memberCount: 4, includeGrade: true, includePhone: true }) : undefined
                              });
                              if (options) {
                                setOptionsInputBuffer(prev => ({ ...prev, [field.id]: options.join(', ') }));
                              }
                            }}
                            style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#fff', fontWeight: 600 }}
                          >
                            <option value="text">🔤 Short Text</option>
                            <option value="email">📧 Email (Pink Box)</option>
                            <option value="tel">📞 Phone / WhatsApp</option>
                            <option value="team-members">👥 Team Members (Fixed Squad)</option>
                            <option value="number">🔢 Number</option>
                            <option value="textarea">📑 Paragraph</option>
                            <option value="select">🔽 Dropdown</option>
                            <option value="radio">🔘 Radio Choice</option>
                            <option value="checkbox">☑️ Checkbox</option>
                            <option value="file">📎 File Upload</option>
                          </select>
                        </div>
                      </div>

                      {/* Placeholder & Required Toggle */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.75rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={field.placeholder || ''}
                          onChange={(e) => handleUpdateField(idx, { placeholder: e.target.value })}
                          placeholder={field.type === 'team-members' ? 'Team Name / Squad Title' : 'Placeholder text...'}
                          style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                        />

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => handleUpdateField(idx, { required: e.target.checked })}
                            style={{ width: '18px', height: '18px', accentColor: '#dc2626' }}
                          />
                          Required Field *
                        </label>
                      </div>

                      {/* TEAM MEMBERS CONFIGURATION (IMAGE 5) */}
                      {field.type === 'team-members' && (
                        <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '12px', border: '1px solid #bbf7d0', marginTop: '0.25rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#166534' }}>
                              👥 Team Members Configuration (Fixed Team Size)
                            </label>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d', background: '#dcfce7', padding: '0.2rem 0.6rem', borderRadius: '100px' }}>
                              {field.teamConfig?.memberCount || 4} Members Set
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#14532d', marginBottom: '0.25rem' }}>
                                Number of Members:
                              </label>
                              <select
                                value={field.teamConfig?.memberCount || 4}
                                onChange={(e) => handleUpdateField(idx, {
                                  teamConfig: {
                                    ...(field.teamConfig || {}),
                                    memberCount: parseInt(e.target.value) || 4
                                  }
                                })}
                                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #86efac', background: '#fff', fontWeight: 700, fontSize: '0.85rem' }}
                              >
                                <option value="2">2 Members</option>
                                <option value="3">3 Members</option>
                                <option value="4">4 Members (Table Quiz Standard)</option>
                                <option value="5">5 Members (Squad + Reserve)</option>
                                <option value="6">6 Members</option>
                              </select>
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', fontWeight: 700, color: '#166534', cursor: 'pointer', marginTop: '1rem' }}>
                              <input
                                type="checkbox"
                                checked={field.teamConfig?.includeGrade !== false}
                                onChange={(e) => handleUpdateField(idx, {
                                  teamConfig: {
                                    ...(field.teamConfig || {}),
                                    includeGrade: e.target.checked
                                  }
                                })}
                                style={{ accentColor: '#16a34a' }}
                              />
                              Ask Grade / Class
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', fontWeight: 700, color: '#166534', cursor: 'pointer', marginTop: '1rem' }}>
                              <input
                                type="checkbox"
                                checked={field.teamConfig?.includePhone !== false}
                                onChange={(e) => handleUpdateField(idx, {
                                  teamConfig: {
                                    ...(field.teamConfig || {}),
                                    includePhone: e.target.checked
                                  }
                                })}
                                style={{ accentColor: '#16a34a' }}
                              />
                              Leader Phone / WhatsApp
                            </label>
                          </div>
                        </div>
                      )}

                      {/* DROPDOWN / RADIO OPTIONS EDITOR (SOLVES COMMA BUG FROM IMAGE 2) */}
                      {isSelectable && (
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '0.25rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155' }}>
                              Dropdown Options (Separated by comma or Add button) *
                            </label>
                            <small style={{ color: '#059669', fontWeight: 700 }}>
                              {(field.options || []).length} Options Active
                            </small>
                          </div>

                          {/* Raw text input buffer so comma typing NEVER fails */}
                          <input
                            type="text"
                            value={optionsInputBuffer[field.id] !== undefined ? optionsInputBuffer[field.id] : (field.options || []).join(', ')}
                            onChange={(e) => handleOptionsBufferChange(field.id, e.target.value, idx)}
                            placeholder="Type options: e.g. Nikila, Senior, Junior"
                            style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '2px solid #94a3b8', fontSize: '0.9rem', fontWeight: 600, background: '#fff' }}
                          />

                          {/* Interactive Option Chips */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.65rem' }}>
                            {(field.options || []).map((opt, oi) => (
                              <span 
                                key={oi}
                                style={{ 
                                  background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
                                  padding: '0.25rem 0.65rem', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 700,
                                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem'
                                }}
                              >
                                {opt}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOptionChip(idx, field.id, oi)}
                                  style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 800, padding: 0 }}
                                  title="Remove option"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Add Buttons Toolbar */}
            <div style={{ border: '2px dashed #cbd5e1', borderRadius: '18px', padding: '1.35rem', textAlign: 'center', background: '#f8fafc' }}>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#334155', marginBottom: '0.75rem' }}>
                ➕ Click to Add Field Type:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                <button type="button" onClick={() => handleAddField('text')} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '0.5rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>🔤 Short Text</button>
                <button type="button" onClick={() => handleAddField('email')} style={{ background: '#fff0f0', border: '1px solid #fecaca', color: '#991b1b', padding: '0.5rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}>📧 Email Box</button>
                <button type="button" onClick={() => handleAddField('team-members')} style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '0.5rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}>👥 Team Members</button>
                <button type="button" onClick={() => handleAddField('select')} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '0.5rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>🔽 Dropdown</button>
                <button type="button" onClick={() => handleAddField('tel')} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '0.5rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>📞 Phone</button>
                <button type="button" onClick={() => handleAddField('number')} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '0.5rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>🔢 Number</button>
                <button type="button" onClick={() => handleAddField('radio')} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '0.5rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>🔘 Radio Group</button>
                <button type="button" onClick={() => handleAddField('file')} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '0.5rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>📎 File Upload</button>
              </div>
            </div>

            {/* ========================================================== */}
            {/* POST-SUBMISSION SUCCESS SETTINGS (IMAGE 2 CUSTOMIZATION)    */}
            {/* ========================================================== */}
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '2px solid #e2e8f0',
              padding: '1.75rem',
              marginTop: '1.75rem',
              boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🎉</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  Post-Submission &amp; WhatsApp Group Settings (Image 2 Screen)
                </h3>
              </div>
              <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
                Customize what candidates see after submitting their application. Provide an official WhatsApp Group invite link, custom instructions, and they will receive their 3D Digital QR Pass automatically!
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                    💬 WhatsApp Group Invite Link (Optional - join button will appear on success screen)
                  </label>
                  <input
                    type="url"
                    value={whatsappGroupLink}
                    onChange={(e) => setWhatsappGroupLink(e.target.value)}
                    placeholder="https://chat.whatsapp.com/..."
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#0f172a' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                      Button Label
                    </label>
                    <input
                      type="text"
                      value={whatsappGroupLabel}
                      onChange={(e) => setWhatsappGroupLabel(e.target.value)}
                      placeholder="e.g. Join Official WhatsApp Group"
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#0f172a' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                      Notice / Verification Instructions
                    </label>
                    <input
                      type="text"
                      value={customSuccessNotice}
                      onChange={(e) => setCustomSuccessNotice(e.target.value)}
                      placeholder="e.g. Please save your QR pass for registration desk check-in."
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#0f172a' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================== */}
            {/* ATTACH FORM TO COMPETITION (BOTTOM OF BUILDER)             */}
            {/* ========================================================== */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              border: '2px solid #e2e8f0',
              padding: '1.75rem',
              marginTop: '1.75rem',
              boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>🏆</span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    Attach Form to Competition or Event
                  </h3>
                </div>
                {(selectedCompetitionSlug && selectedCompetitionSlug !== '__standalone__') ? (
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '0.25rem 0.65rem', borderRadius: '100px', border: '1px solid #86efac' }}>
                    ✓ 1 Competition Linked
                  </span>
                ) : (selectedCompetitionSlug === '__standalone__' || isStandalone) ? (
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', background: '#dbeafe', padding: '0.25rem 0.65rem', borderRadius: '100px', border: '1px solid #bfdbfe' }}>
                    🌐 Standalone Public Form
                  </span>
                ) : null}
              </div>
              <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
                Select whether this form links directly to an existing competition or functions as a <strong>Standalone Public Form</strong> (e.g. Annual Quiz Day Invitations, Special Event Registrations).
              </p>

              {/* Competition Selection Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '360px', overflowY: 'auto', paddingRight: '0.35rem' }}>
                
                {/* Option 0A: Standalone Public Event Form (Non-competition / Day Invites / Special Event) */}
                <div
                  onClick={() => {
                    setSelectedCompetitionSlug('__standalone__');
                    setIsStandalone(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    borderRadius: '14px',
                    border: (selectedCompetitionSlug === '__standalone__' || isStandalone) ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: (selectedCompetitionSlug === '__standalone__' || isStandalone) ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer',
                    boxShadow: (selectedCompetitionSlug === '__standalone__' || isStandalone) ? '0 4px 14px rgba(37, 99, 235, 0.16)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="selected_competition_radio"
                    checked={selectedCompetitionSlug === '__standalone__' || isStandalone}
                    onChange={() => {
                      setSelectedCompetitionSlug('__standalone__');
                      setIsStandalone(true);
                    }}
                    style={{ accentColor: '#2563eb', width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#1e40af' }}>
                        🌐 Standalone Public Event Form (Day Invite / Special Event / Invitations)
                      </span>
                      <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '6px' }}>
                        Public Website Form
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.2rem' }}>
                      Use this for Annual Quiz Days, Special Event Registrations, or General Invitations. You will get a shareable link <strong>/forms/[slug]</strong> with the full website navigation!
                    </div>
                  </div>
                </div>

                {/* Option 0B: Draft / Unlinked */}
                <div
                  onClick={() => {
                    setSelectedCompetitionSlug('');
                    setIsStandalone(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.9rem 1.15rem',
                    borderRadius: '14px',
                    border: (selectedCompetitionSlug === '' && !isStandalone) ? '2px solid #64748b' : '1px solid #cbd5e1',
                    background: (selectedCompetitionSlug === '' && !isStandalone) ? '#f8fafc' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="selected_competition_radio"
                    checked={selectedCompetitionSlug === '' && !isStandalone}
                    onChange={() => {
                      setSelectedCompetitionSlug('');
                      setIsStandalone(false);
                    }}
                    style={{ accentColor: '#64748b', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1e293b' }}>
                      ⚪ Draft / Unlinked (Not attached to any tournament)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Save as draft without publishing to a competition page or standalone public URL.
                    </div>
                  </div>
                </div>

                {/* All Active Competitions */}
                {competitionsList.map((comp) => {
                  const isSelected = selectedCompetitionSlug === comp.slug;
                  const cleanTitle = stripStyledText(comp.title);
                  
                  // Check if another form is currently linked to this competition
                  const otherLinkedForm = forms.find(f => f.competitionSlug === comp.slug && f.id !== editingFormId);

                  return (
                    <div
                      key={comp.slug}
                      onClick={() => setSelectedCompetitionSlug(comp.slug)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '0.95rem 1.15rem',
                        borderRadius: '14px',
                        border: isSelected ? '2px solid #dc2626' : '1px solid #cbd5e1',
                        background: isSelected ? '#fff8f8' : '#ffffff',
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 6px 16px rgba(220, 38, 38, 0.14)' : '0 1px 3px rgba(0,0,0,0.02)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <input
                        type="radio"
                        name="selected_competition_radio"
                        checked={isSelected}
                        onChange={() => setSelectedCompetitionSlug(comp.slug)}
                        style={{ accentColor: '#dc2626', width: '18px', height: '18px', cursor: 'pointer' }}
                      />

                      {/* Image Thumbnail */}
                      {comp.image && (
                        <img
                          src={comp.image}
                          alt={cleanTitle}
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '10px',
                            objectFit: 'cover',
                            border: '1px solid #e2e8f0',
                            flexShrink: 0
                          }}
                        />
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                            {cleanTitle}
                          </span>
                          {comp.isStarred && (
                            <span style={{ fontSize: '0.72rem', background: '#fef3c7', color: '#b45309', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>
                              ⭐ Featured
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                          {comp.eventDate && <span>📅 Event: {comp.eventDate}</span>}
                          {comp.deadline && <span>⏰ Deadline: {comp.deadline}</span>}
                        </div>

                        {otherLinkedForm && (
                          <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600, marginTop: '0.3rem' }}>
                            ⚠️ Currently linked to: "{otherLinkedForm.title}" (Saving will re-link to this form)
                          </div>
                        )}
                      </div>

                      {isSelected && (
                        <div style={{
                          background: '#dc2626',
                          color: '#ffffff',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.35rem 0.75rem',
                          borderRadius: '100px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          flexShrink: 0
                        }}>
                          <span>✓ Selected</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Prominent Save Button */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                    {selectedCompetitionSlug ? (
                      <>Ready to link with: <strong style={{ color: '#dc2626' }}>{stripStyledText(competitionsList.find(c => c.slug === selectedCompetitionSlug)?.title || selectedCompetitionSlug)}</strong></>
                    ) : (
                      <>Save as standalone form (Unlinked)</>
                    )}
                  </div>
                  <small style={{ color: '#64748b', fontSize: '0.75rem' }}>Saved locally on localhost for instant testing</small>
                </div>

                <button
                  type="button"
                  onClick={handleSaveForm}
                  style={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.9rem 2rem',
                    borderRadius: '14px',
                    fontWeight: 900,
                    fontSize: '0.98rem',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(220, 38, 38, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>💾</span> Save Form &amp; Link to Competition
                </button>
              </div>
            </div>
          </div>

          {/* EXACT IMAGE 2 FORM PREVIEW CARD (RIGHT) */}
          <div style={{ position: 'sticky', top: '1rem', maxHeight: 'calc(100vh - 2rem)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexShrink: 0 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: accentColor, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: accentColor, display: 'inline-block' }}></span>
                REALTIME 3D LIVE FORM (IMAGE 2 REPLICA)
              </span>
              <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700, background: '#f1f5f9', padding: '0.2rem 0.65rem', borderRadius: '100px', border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>↕️</span> Scrollable Preview
              </span>
            </div>

            {/* The Exact Image 2 Card Replica */}
            <div 
              className="form-preview-scrollable"
              style={{ 
                background: '#ffffff',
                borderRadius: '24px',
                border: '1px solid #e2e8f0',
                padding: '2.5rem 2.25rem',
                boxShadow: '0 25px 60px -15px rgba(0,0,0,0.1), 0 0 1px 1px rgba(0,0,0,0.04)',
                position: 'relative',
                maxHeight: 'calc(100vh - 4.5rem)',
                overflowY: 'auto'
              }}
            >
              {/* Top Accent Stripe */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: `linear-gradient(90deg, ${accentColor} 0%, #f97316 100%)` }} />

              {/* Form Title & Subtitle */}
              <div style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.95rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 0.85rem 0', lineHeight: 1.25 }}>
                  {formTitle || 'Untitled Form'}
                </h2>
                <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                  {formDescription || 'Please provide your details below to register.'}
                </p>
              </div>

              {/* The Live Form Fields */}
              <form onSubmit={handleTestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {formFields.map((field) => {
                  const isEmailBox = field.type === 'email';

                  // 1. Highlighted Pink/Red Email Box (Exact Match to Image 2!)
                  if (isEmailBox) {
                    return (
                      <div 
                        key={field.id}
                        style={{ 
                          background: '#fff8f8',
                          border: '1px solid #fecaca',
                          borderRadius: '14px',
                          padding: '1.35rem 1.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.55rem'
                        }}
                      >
                        <label style={{ fontSize: '0.92rem', fontWeight: 700, color: '#991b1b' }}>
                          {field.label} {field.required && <span style={{ color: '#dc2626' }}>*</span>}
                        </label>
                        <input
                          type="email"
                          required={field.required}
                          placeholder={field.placeholder || 'you@example.com'}
                          value={previewAnswers[field.label] || ''}
                          onChange={(e) => setPreviewAnswers({ ...previewAnswers, [field.label]: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.85rem 1.1rem',
                            borderRadius: '10px',
                            border: '1px solid #fca5a5',
                            background: '#ffffff',
                            fontSize: '0.95rem',
                            color: '#0f172a',
                            outline: 'none'
                          }}
                        />
                        <span style={{ fontSize: '0.78rem', color: '#b91c1c', fontWeight: 500 }}>
                          {field.helpText || 'This form is limited to 1 response per email.'}
                        </span>
                      </div>
                    );
                  }

                  // 2. Regular Inputs (Exact match to Name, Grade, School Name in Image 2)
                  return (
                    <div key={field.id}>
                      <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.45rem' }}>
                        {field.label} {field.required && <span style={{ color: '#dc2626' }}>*</span>}
                      </label>

                      {['text', 'number', 'tel'].includes(field.type) && (
                        <input
                          type={field.type}
                          required={field.required}
                          placeholder={field.placeholder}
                          value={previewAnswers[field.label] || ''}
                          onChange={(e) => setPreviewAnswers({ ...previewAnswers, [field.label]: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.85rem 1.1rem',
                            borderRadius: '12px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.95rem',
                            background: '#fff',
                            color: '#0f172a',
                            outline: 'none'
                          }}
                        />
                      )}

                      {/* 3. Dropdown Menu (Fixes Image 2 dropdown options bug!) */}
                      {field.type === 'select' && (
                        <select
                          required={field.required}
                          value={previewAnswers[field.label] || ''}
                          onChange={(e) => setPreviewAnswers({ ...previewAnswers, [field.label]: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.85rem 1.1rem',
                            borderRadius: '12px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.95rem',
                            background: '#ffffff',
                            color: '#0f172a',
                            fontWeight: 600,
                            outline: 'none'
                          }}
                        >
                          <option value="">-- Choose Option --</option>
                          {(field.options && field.options.length > 0 ? field.options : ['No options yet']).map((opt, oi) => (
                            <option key={oi} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* 4. Radio Buttons Group */}
                      {field.type === 'radio' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.3rem' }}>
                          {(field.options || ['Option 1', 'Option 2']).map((opt, oi) => (
                            <label key={oi} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.92rem', color: '#334155', cursor: 'pointer', padding: '0.4rem 0.6rem', borderRadius: '8px', background: previewAnswers[field.label] === opt ? '#eff6ff' : 'transparent' }}>
                              <input
                                type="radio"
                                name={`rad_${field.id}`}
                                value={opt}
                                required={field.required}
                                checked={previewAnswers[field.label] === opt}
                                onChange={(e) => setPreviewAnswers({ ...previewAnswers, [field.label]: e.target.value })}
                                style={{ accentColor: accentColor }}
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      )}

                      {/* 5. File Upload Box */}
                      {field.type === 'file' && (
                        <div style={{ border: '2px dashed #cbd5e1', borderRadius: '14px', padding: '1.5rem', textAlign: 'center', background: '#f8fafc' }}>
                          <span style={{ fontSize: '1.75rem', display: 'block', marginBottom: '0.3rem' }}>📎</span>
                          <input 
                            type="file" 
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) setPreviewAnswers({ ...previewAnswers, [field.label]: f.name + ' (Uploaded)' });
                            }} 
                            style={{ fontSize: '0.85rem' }} 
                          />
                        </div>
                      )}

                      {/* 6. Team Members Box (Image 5 & Table Quiz Feature) */}
                      {field.type === 'team-members' && (
                        <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                              👥 {field.label} ({field.teamConfig?.memberCount || 4} Members)
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>Team Squad Slots</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            {Array.from({ length: field.teamConfig?.memberCount || 4 }).map((_, mi) => (
                              <div key={mi} style={{ background: '#fff', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: accentColor, color: '#fff', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  {mi + 1}
                                </span>
                                <div style={{ flex: 1, fontSize: '0.82rem', color: '#64748b' }}>
                                  {mi === 0 ? 'Member 1 (Team Leader) • Name, Grade & WhatsApp' : `Member ${mi + 1} • Full Name & Grade`}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <button
                  type="submit"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor} 0%, #b91c1c 100%)`,
                    color: '#fff',
                    border: 'none',
                    padding: '1.1rem',
                    borderRadius: '14px',
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    cursor: 'pointer',
                    marginTop: '1rem',
                    boxShadow: `0 12px 25px -4px ${accentColor}55`,
                    transition: 'transform 0.15s ease'
                  }}
                >
                  🚀 Test Submit Application
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ADVANCED SUBMISSIONS HUB (FILTER BY INTER / INNER / OPEN) */}
      {/* ========================================================================= */}
      {activeTab === 'submissions' && (
        <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '2.5rem', boxShadow: '0 15px 40px rgba(0,0,0,0.04)' }}>
          
          {/* Header & Export */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Competition Submissions Hub ({filteredSubmissions.length})
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0.25rem 0 0 0' }}>
                Filter applications by <strong>Inter-School</strong>, <strong>Inner-School</strong>, or <strong>All-Island Open</strong>.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleBulkSync}
                disabled={isSyncingSubmissions}
                style={{
                  background: '#f8fafc',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  padding: '0.85rem 1.35rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  cursor: isSyncingSubmissions ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.88rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}
              >
                <span>⚡</span> {isSyncingSubmissions ? 'Syncing...' : 'Sync Cloud Submissions'}
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                style={{ 
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', 
                  color: '#fff', border: 'none', padding: '0.85rem 1.5rem', 
                  borderRadius: '12px', fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  boxShadow: '0 8px 20px rgba(4, 120, 87, 0.35)'
                }}
              >
                <span>📥</span> Export to Excel / CSV
              </button>
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>TOTAL APPLICATIONS</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginTop: '0.2rem' }}>{submissions.length}</div>
            </div>

            <div style={{ background: '#eff6ff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #bfdbfe' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1d4ed8' }}>INTER-SCHOOL</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1d4ed8', marginTop: '0.2rem' }}>
                {submissions.filter(s => s.scope === 'inter-school').length}
              </div>
            </div>

            <div style={{ background: '#f5f3ff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #ddd6fe' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6d28d9' }}>INNER-SCHOOL</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#6d28d9', marginTop: '0.2rem' }}>
                {submissions.filter(s => s.scope === 'inner-school').length}
              </div>
            </div>

            <div style={{ background: '#ecfdf5', padding: '1.25rem', borderRadius: '16px', border: '1px solid #a7f3d0' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#047857' }}>ALL-ISLAND OPEN / OTHER</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#047857', marginTop: '0.2rem' }}>
                {submissions.filter(s => !['inter-school', 'inner-school'].includes(s.scope)).length}
              </div>
            </div>
          </div>

          {/* Firebase Rules Notice if blocked */}
          {firebaseRulesWarning && (
            <div style={{
              background: '#fff7ed',
              border: '1px solid #fdba74',
              borderRadius: '14px',
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.4rem' }}>⚠️</span>
                <div>
                  <strong style={{ color: '#9a3412', display: 'block', fontSize: '0.88rem' }}>
                    Firebase Cloud Rules Alert (Submissions Saved Locally):
                  </strong>
                  <span style={{ color: '#c2410c', fontSize: '0.8rem' }}>
                    Your Cloud Firestore rules are currently set to <code>allow read, write: if false;</code>. Change it to <code>allow read, write: if true;</code> in Firebase Console to sync data directly to the cloud.
                  </span>
                </div>
              </div>
              <a
                href="https://console.firebase.google.com/project/ncqc-a787e/firestore/databases/-default-/security/rules"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#ea580c',
                  color: '#ffffff',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                Open Firebase Rules &rarr;
              </a>
            </div>
          )}

          {/* 🏆 COMPETITION SELECTOR FILTER (Image 2 Feature) */}
          <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem' }}>🏆</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                  Filter by Competition:
                </span>
                {filterCompetition !== 'all' && (
                  <span style={{ fontSize: '0.72rem', background: '#fee2e2', color: '#dc2626', padding: '0.15rem 0.55rem', borderRadius: '100px', fontWeight: 800 }}>
                    Filtered
                  </span>
                )}
              </div>
              {filterCompetition !== 'all' && (
                <button
                  type="button"
                  onClick={() => setFilterCompetition('all')}
                  style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Clear Competition Filter (Show All)
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', overflowX: 'auto', paddingBottom: '0.4rem' }}>
              {/* All Competitions Button */}
              <button
                type="button"
                onClick={() => setFilterCompetition('all')}
                style={{
                  padding: '0.65rem 1.15rem',
                  borderRadius: '12px',
                  border: filterCompetition === 'all' ? '2px solid #0f172a' : '1px solid #cbd5e1',
                  background: filterCompetition === 'all' ? '#0f172a' : '#ffffff',
                  color: filterCompetition === 'all' ? '#ffffff' : '#334155',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  whiteSpace: 'nowrap',
                  boxShadow: filterCompetition === 'all' ? '0 4px 12px rgba(15, 23, 42, 0.18)' : 'none',
                  flexShrink: 0
                }}
              >
                <span>🌐</span> All Competitions ({submissions.length})
              </button>

              {/* Dynamic Competition Buttons */}
              {competitionsList.map(comp => {
                const isSelected = filterCompetition === comp.slug;
                const cleanTitle = stripStyledText(comp.title);
                const compSubCount = submissions.filter(s => 
                  s.competitionSlug === comp.slug ||
                  (s.competitionTitle && s.competitionTitle.toLowerCase().includes(cleanTitle.toLowerCase())) ||
                  (s.data && (
                    s.data['Target Competition'] === comp.slug ||
                    s.data['Attached Competition'] === comp.slug ||
                    JSON.stringify(s.data).toLowerCase().includes(comp.slug.toLowerCase()) ||
                    JSON.stringify(s.data).toLowerCase().includes(cleanTitle.toLowerCase())
                  ))
                ).length;

                return (
                  <button
                    key={comp.slug}
                    type="button"
                    onClick={() => setFilterCompetition(comp.slug)}
                    style={{
                      padding: '0.6rem 1rem',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid #dc2626' : '1px solid #e2e8f0',
                      background: isSelected ? '#fff5f5' : '#ffffff',
                      color: isSelected ? '#dc2626' : '#334155',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      whiteSpace: 'nowrap',
                      boxShadow: isSelected ? '0 4px 12px rgba(220, 38, 38, 0.14)' : 'none',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {comp.image && (
                      <img 
                        src={comp.image} 
                        alt={cleanTitle} 
                        style={{ width: '20px', height: '20px', borderRadius: '5px', objectFit: 'cover' }} 
                      />
                    )}
                    <span>{cleanTitle}</span>
                    <span style={{
                      fontSize: '0.72rem',
                      background: isSelected ? '#dc2626' : '#f1f5f9',
                      color: isSelected ? '#ffffff' : '#64748b',
                      padding: '0.12rem 0.45rem',
                      borderRadius: '100px',
                      fontWeight: 800
                    }}>
                      {compSubCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scope Segmented Filter Buttons */}
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '1.5rem', background: '#f8fafc', padding: '0.65rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={() => setFilterScope('all')}
              style={{
                padding: '0.65rem 1.2rem', borderRadius: '10px',
                border: filterScope === 'all' ? '2px solid #dc2626' : '1px solid transparent',
                background: filterScope === 'all' ? '#fff' : 'transparent',
                color: filterScope === 'all' ? '#dc2626' : '#475569',
                fontWeight: 800, cursor: 'pointer', boxShadow: filterScope === 'all' ? '0 4px 10px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              🌐 All Submissions ({submissions.length})
            </button>

            {scopesList.map(s => {
              const count = submissions.filter(sub => sub.scope === s.id).length;
              const isSelected = filterScope === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setFilterScope(s.id)}
                  style={{
                    padding: '0.65rem 1.2rem', borderRadius: '10px',
                    border: isSelected ? `2px solid ${s.color}` : '1px solid transparent',
                    background: isSelected ? '#fff' : 'transparent',
                    color: isSelected ? s.color : '#475569',
                    fontWeight: 800, cursor: 'pointer',
                    boxShadow: isSelected ? `0 4px 12px ${s.color}25` : 'none'
                  }}
                >
                  <span>{s.icon}</span> {s.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Sub Filters: Category, Status & Live Search */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Category:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff', fontWeight: 600 }}
              >
                <option value="all">All Categories</option>
                <option value="Senior (Grade 10 - 13)">Senior</option>
                <option value="Junior (Grade 6 - 9)">Junior</option>
                <option value="Primary (Grade 1 - 5)">Primary</option>
                <option value="Open Category">Open</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff', fontWeight: 600 }}
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <input
              type="text"
              placeholder="🔍 Search by Referral ID (e.g. REG-2026-XXXXXX), Candidate, School, Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', flex: 1, minWidth: '260px' }}
            />
          </div>

          {/* Submissions Table / Empty State */}
          {filteredSubmissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', border: '2px dashed #e2e8f0', borderRadius: '18px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📭</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                No submissions found for this filter
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
                Go to "Design New Form", test-submit an application in the Live Preview card, and it will immediately show up here!
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 800 }}>
                    <th style={{ padding: '1rem' }}>Scope</th>
                    <th style={{ padding: '1rem' }}>Referral ID</th>
                    <th style={{ padding: '1rem' }}>Candidate / School</th>
                    <th style={{ padding: '1rem' }}>Email / Contact</th>
                    <th style={{ padding: '1rem' }}>Form Title</th>
                    <th style={{ padding: '1rem' }}>Date</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((sub, i) => {
                    const matched = scopesList.find(s => s.id === sub.scope) || scopesList[0];
                    const candidate = sub.data['Name'] || sub.data['Candidate Full Name'] || sub.data['Team Leader Full Name'] || 'N/A';
                    const school = sub.data['School Name'] || sub.data['School / Institution Name'] || 'N/A';
                    const email = sub.data['Email Address'] || sub.data['Email'] || 'N/A';

                    return (
                      <tr key={sub.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            fontSize: '0.78rem', fontWeight: 800, padding: '0.3rem 0.75rem', borderRadius: '100px',
                            background: `${matched.color}15`,
                            color: matched.color
                          }}>
                            {matched.icon} {matched.name}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ 
                              fontFamily: 'monospace', 
                              fontWeight: 800, 
                              fontSize: '0.82rem', 
                              color: '#0f172a',
                              background: '#f1f5f9',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              letterSpacing: '0.04em',
                              whiteSpace: 'nowrap'
                            }}>
                              {sub.id}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(sub.id);
                                showNotification(`Copied ID ${sub.id}!`);
                              }}
                              title="Copy Referral ID"
                              style={{
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                padding: '0.2rem 0.4rem',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                color: '#475569'
                              }}
                            >
                              📋
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <strong style={{ color: '#0f172a', display: 'block' }}>{candidate}</strong>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{school}</span>
                        </td>
                        <td style={{ padding: '1rem', color: '#0f172a', fontWeight: 600 }}>
                          {email}
                        </td>
                        <td style={{ padding: '1rem', color: '#475569' }}>
                          <strong style={{ color: '#0f172a', display: 'block', fontSize: '0.92rem' }}>{sub.formTitle}</strong>
                          {((sub as any).competitionTitle || sub.data?.['Target Competition'] || sub.data?.['Attached Competition']) && (
                            <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                              🏆 {(sub as any).competitionTitle || sub.data?.['Target Competition'] || sub.data?.['Attached Competition']}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.8rem' }}>
                          {sub.submittedAt}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: '100px',
                            background: sub.status === 'confirmed' ? '#dcfce7' : sub.status === 'pending' ? '#fef3c7' : '#fee2e2',
                            color: sub.status === 'confirmed' ? '#15803d' : sub.status === 'pending' ? '#b45309' : '#b91c1c'
                          }}>
                            {sub.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedSubmission(sub)}
                              style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '0.5rem 0.95rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                              👁️ View Dossier
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubmission(sub.id)}
                              style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.5rem 0.65rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                              title="Permanently Delete from Firebase Database"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* FULL SUBMISSION MODAL */}
      {selectedSubmission && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '24px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', position: 'relative' }}>
            <button 
              type="button"
              onClick={() => setSelectedSubmission(null)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '1.1rem', cursor: 'pointer' }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.65rem', marginBottom: '0.4rem', paddingRight: '2rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                APPLICATION DOSSIER • {selectedSubmission.scope.toUpperCase()}
              </span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '0.85rem', 
                  fontWeight: 900, 
                  color: '#0f172a', 
                  background: '#f1f5f9', 
                  padding: '0.25rem 0.65rem', 
                  borderRadius: '8px', 
                  border: '1px solid #cbd5e1' 
                }}>
                  ID: {selectedSubmission.id}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedSubmission.id);
                    showNotification(`Copied ID ${selectedSubmission.id}!`);
                  }}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: '#0f172a'
                  }}
                  title="Copy ID"
                >
                  📋 Copy
                </button>
              </div>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: '0.25rem 0 1rem 0' }}>
              {selectedSubmission.formTitle}
            </h2>

            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
              {Object.entries(selectedSubmission.data).map(([key, val]) => (
                <div key={key} style={{ borderBottom: '1px solid #eef2f6', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', display: 'block' }}>{key}</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '0.1rem', display: 'block' }}>{String(val)}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleUpdateSubmissionStatus(selectedSubmission.id, 'confirmed')}
                  style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '0.5rem 0.9rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                >
                  ✓ Confirm
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateSubmissionStatus(selectedSubmission.id, 'rejected')}
                  style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '0.5rem 0.9rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                >
                  ✕ Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSubmission(selectedSubmission.id)}
                  style={{ background: '#fff', color: '#dc2626', border: '1px solid #fca5a5', padding: '0.5rem 0.9rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                >
                  🗑️ Delete from Firebase
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '0.6rem 1.4rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
