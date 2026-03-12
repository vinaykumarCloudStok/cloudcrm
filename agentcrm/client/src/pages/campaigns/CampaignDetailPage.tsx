import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Plus,
  Play,
  Pause,
  Pencil,
  Trash2,
  GripVertical,
  Search,
  UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getCampaign,
  updateCampaign,
  deleteCampaign,
  addCampaignStep,
  enrollContact,
} from '../../services/campaignApi';
import { getContacts } from '../../services/contactApi';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import type { Campaign, CampaignStep, CampaignEnrollment, Contact } from '../../utils/types';

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  // Step modal
  const [showAddStep, setShowAddStep] = useState(false);
  const [stepForm, setStepForm] = useState({ subject: '', bodyTemplate: '', delayDays: 1 });

  // Enroll section
  const [contactSearch, setContactSearch] = useState('');
  const [contactResults, setContactResults] = useState<Contact[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchCampaign = useCallback(async () => {
    if (!id) return;
    try {
      const res = await getCampaign(Number(id));
      setCampaign(res.data);
    } catch {
      toast.error('Failed to load campaign');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  const handleToggleStatus = async () => {
    if (!campaign) return;
    const newStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await updateCampaign(campaign.id, { status: newStatus });
      setCampaign((c) => (c ? { ...c, status: newStatus } : c));
      toast.success(`Campaign ${newStatus === 'ACTIVE' ? 'activated' : 'paused'}`);
    } catch {
      toast.error('Failed to update campaign status');
    }
  };

  const handleDelete = async () => {
    if (!campaign) return;
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await deleteCampaign(campaign.id);
      toast.success('Campaign deleted');
      navigate('/campaigns');
    } catch {
      toast.error('Failed to delete campaign');
    }
  };

  const handleAddStep = async () => {
    if (!campaign) return;
    try {
      const nextOrder = (campaign.steps?.length ?? 0) + 1;
      await addCampaignStep(campaign.id, { ...stepForm, stepOrder: nextOrder });
      toast.success('Step added');
      setShowAddStep(false);
      setStepForm({ subject: '', bodyTemplate: '', delayDays: 1 });
      fetchCampaign();
    } catch {
      toast.error('Failed to add step');
    }
  };

  const handleSearchContacts = async () => {
    if (!contactSearch.trim()) return;
    try {
      setSearchLoading(true);
      const res = await getContacts({ search: contactSearch });
      setContactResults(res.data.data ?? res.data ?? []);
    } catch {
      toast.error('Failed to search contacts');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleEnroll = async (contactId: number) => {
    if (!campaign) return;
    try {
      await enrollContact(campaign.id, contactId);
      toast.success('Contact enrolled');
      setContactResults([]);
      setContactSearch('');
      fetchCampaign();
    } catch {
      toast.error('Failed to enroll contact');
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (!campaign) return <p className="text-gray-500 text-center py-8">Campaign not found</p>;

  const sortedSteps = [...(campaign.steps ?? [])].sort((a, b) => a.stepOrder - b.stepOrder);

  return (
    <div>
      <button
        onClick={() => navigate('/campaigns')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Campaigns
      </button>

      <PageHeader title={campaign.name} subtitle={campaign.description ?? undefined}>
        <StatusBadge status={campaign.status} size="md" />
        <button
          onClick={handleToggleStatus}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {campaign.status === 'ACTIVE' ? (
            <>
              <Pause className="h-4 w-4" /> Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4" /> Activate
            </>
          )}
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Steps */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Email Steps</h3>
            <button
              onClick={() => setShowAddStep(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add Step
            </button>
          </div>

          {sortedSteps.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No steps configured yet</p>
          ) : (
            <div className="space-y-3">
              {sortedSteps.map((step) => (
                <div
                  key={step.id}
                  className="group flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-2 pt-0.5">
                    <GripVertical className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                    <span className="flex items-center justify-center h-6 w-6 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full shrink-0">
                      {step.stepOrder}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {step.subject}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      Delay: {step.delayDays} day{step.delayDays !== 1 ? 's' : ''} after previous
                      step
                    </p>
                    {step.bodyTemplate && (
                      <p className="text-xs text-gray-400 line-clamp-2">{step.bodyTemplate}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enrollments */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Enrollments</h3>

          {/* Enroll Contact Search */}
          <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
            <p className="text-xs font-medium text-gray-600 mb-2">Enroll a Contact</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                <Search className="h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchContacts()}
                  placeholder="Search contacts..."
                  className="flex-1 text-sm outline-none bg-transparent"
                />
              </div>
              <button
                onClick={handleSearchContacts}
                disabled={searchLoading}
                className="px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                Search
              </button>
            </div>
            {contactResults.length > 0 && (
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {contactResults.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-2 rounded-md bg-white border border-gray-100 hover:border-gray-200"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {contact.firstName} {contact.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{contact.email}</p>
                    </div>
                    <button
                      onClick={() => handleEnroll(contact.id)}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-teal-700 hover:bg-teal-50 rounded transition-colors shrink-0"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Enroll
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enrollment List */}
          {!campaign.enrollments?.length ? (
            <p className="text-sm text-gray-500 text-center py-4">No contacts enrolled</p>
          ) : (
            <div className="space-y-2">
              {campaign.enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {enrollment.contact
                        ? `${enrollment.contact.firstName} ${enrollment.contact.lastName}`
                        : `Contact #${enrollment.contactId}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      Step {enrollment.currentStep} &middot; Enrolled{' '}
                      {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={enrollment.status} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Step Modal */}
      <Modal isOpen={showAddStep} onClose={() => setShowAddStep(false)} title="Add Campaign Step">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={stepForm.subject}
              onChange={(e) => setStepForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="Email subject line"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body Template</label>
            <textarea
              value={stepForm.bodyTemplate}
              onChange={(e) => setStepForm((f) => ({ ...f, bodyTemplate: e.target.value }))}
              rows={6}
              placeholder="Email body content. Use {{firstName}}, {{companyName}} for personalization."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delay (days after previous step)
            </label>
            <input
              type="number"
              min={0}
              value={stepForm.delayDays}
              onChange={(e) =>
                setStepForm((f) => ({ ...f, delayDays: Math.max(0, Number(e.target.value)) }))
              }
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowAddStep(false)}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddStep}
              disabled={!stepForm.subject.trim()}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              Add Step
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
