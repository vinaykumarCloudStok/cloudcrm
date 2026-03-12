import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Linkedin,
  Building2,
  Pencil,
  PhoneCall,
  MessageSquare,
  Users,
  StickyNote,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getContact, updateContact } from '../../services/contactApi';
import { getActivities, createActivity } from '../../services/activityApi';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import type { Contact, Activity } from '../../utils/types';

const ACTIVITY_TYPES = [
  { key: 'CALL', label: 'Call', icon: PhoneCall },
  { key: 'EMAIL', label: 'Email', icon: MessageSquare },
  { key: 'MEETING', label: 'Meeting', icon: Users },
  { key: 'NOTE', label: 'Note', icon: StickyNote },
] as const;

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [activeActivityType, setActiveActivityType] = useState<string | null>(null);
  const [activityDescription, setActivityDescription] = useState('');
  const [submittingActivity, setSubmittingActivity] = useState(false);
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    department: '',
    linkedinUrl: '',
    communicationStyle: '',
    doNotContact: false,
  });

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      try {
        const [contactRes, activityRes] = await Promise.all([
          getContact(Number(id)),
          getActivities({ contactId: Number(id) }),
        ]);
        setContact(contactRes.data);
        setActivities(
          Array.isArray(activityRes.data) ? activityRes.data : activityRes.data?.data ?? [],
        );
      } catch {
        toast.error('Failed to load contact');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const openEdit = () => {
    if (!contact) return;
    setEditData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      jobTitle: contact.jobTitle ?? '',
      department: contact.department ?? '',
      linkedinUrl: contact.linkedinUrl ?? '',
      communicationStyle: contact.communicationStyle ?? '',
      doNotContact: contact.doNotContact,
    });
    setShowEdit(true);
  };

  const handleEdit = async () => {
    if (!id) return;
    try {
      const res = await updateContact(Number(id), editData);
      setContact(res.data);
      setShowEdit(false);
      toast.success('Contact updated');
    } catch {
      toast.error('Failed to update contact');
    }
  };

  const handleLogActivity = async () => {
    if (!id || !activeActivityType || !activityDescription.trim()) return;
    setSubmittingActivity(true);
    try {
      const res = await createActivity({
        type: activeActivityType,
        description: activityDescription.trim(),
        contactId: Number(id),
        accountId: contact?.accountId,
      });
      setActivities((prev) => [res.data, ...prev]);
      setActivityDescription('');
      setActiveActivityType(null);
      toast.success('Activity logged');
    } catch {
      toast.error('Failed to log activity');
    } finally {
      setSubmittingActivity(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (!contact) return <p className="text-gray-500 text-center py-8">Contact not found</p>;

  return (
    <div>
      <button
        onClick={() => navigate('/contacts')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Contacts
      </button>

      <PageHeader
        title={`${contact.firstName} ${contact.lastName}`}
        subtitle={contact.jobTitle ?? undefined}
      >
        <StatusBadge status={contact.roleType} size="md" />
        <button
          onClick={openEdit}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </button>
      </PageHeader>

      {contact.doNotContact && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 p-3">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <p className="text-sm font-medium text-red-700">Do Not Contact</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Details */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Role Type</p>
              <StatusBadge status={contact.roleType} size="md" />
            </div>
            {contact.email && (
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <a
                  href={`mailto:${contact.email}`}
                  className="text-sm text-teal-600 hover:underline flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" /> {contact.email}
                </a>
              </div>
            )}
            {contact.phone && (
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm text-gray-700 flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {contact.phone}
                </p>
              </div>
            )}
            {contact.department && (
              <div>
                <p className="text-xs text-gray-500">Department</p>
                <p className="text-sm text-gray-700">{contact.department}</p>
              </div>
            )}
            {contact.linkedinUrl && (
              <div>
                <p className="text-xs text-gray-500">LinkedIn</p>
                <a
                  href={contact.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-teal-600 hover:underline flex items-center gap-1"
                >
                  <Linkedin className="h-3 w-3" /> Profile
                </a>
              </div>
            )}
            {contact.communicationStyle && (
              <div>
                <p className="text-xs text-gray-500">Communication Style</p>
                <p className="text-sm text-gray-700">{contact.communicationStyle}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Do Not Contact</p>
              <p className="text-sm text-gray-700">{contact.doNotContact ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Last Contacted</p>
              <p className="text-sm text-gray-700">
                {contact.lastContactedAt
                  ? new Date(contact.lastContactedAt).toLocaleDateString()
                  : 'Never'}
              </p>
            </div>
          </div>
        </div>

        {/* Account Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Account</h3>
          {contact.account ? (
            <button
              onClick={() => navigate(`/accounts/${contact.accountId}`)}
              className="w-full text-left p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">
                  {contact.account.companyName}
                </span>
              </div>
              {contact.account.industry && (
                <p className="text-xs text-gray-500 mt-1 ml-6">{contact.account.industry}</p>
              )}
            </button>
          ) : (
            <p className="text-sm text-gray-500">No account linked</p>
          )}
        </div>

        {/* Log Activity */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Log Activity</h3>
          <div className="flex items-center gap-2 mb-4">
            {ACTIVITY_TYPES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() =>
                  setActiveActivityType(activeActivityType === key ? null : key)
                }
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  activeActivityType === key
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
          {activeActivityType && (
            <div className="space-y-3">
              <textarea
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                rows={3}
                placeholder={`Describe the ${activeActivityType.toLowerCase()}...`}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleLogActivity}
                  disabled={submittingActivity || !activityDescription.trim()}
                  className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  {submittingActivity ? 'Saving...' : 'Log Activity'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Activity Timeline */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Activity Timeline</h3>
          {activities.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No activities recorded yet</p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="shrink-0 mt-0.5">
                    <div className="h-8 w-8 rounded-full bg-teal-50 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-teal-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full uppercase">
                        {activity.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(activity.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{activity.description}</p>
                    {activity.user && (
                      <p className="text-xs text-gray-400 mt-1">
                        by {activity.user.firstName} {activity.user.lastName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Contact" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={editData.firstName}
                onChange={(e) => setEditData((d) => ({ ...d, firstName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={editData.lastName}
                onChange={(e) => setEditData((d) => ({ ...d, lastName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={editData.email}
                onChange={(e) => setEditData((d) => ({ ...d, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={editData.phone}
                onChange={(e) => setEditData((d) => ({ ...d, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <input
                type="text"
                value={editData.jobTitle}
                onChange={(e) => setEditData((d) => ({ ...d, jobTitle: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input
                type="text"
                value={editData.department}
                onChange={(e) => setEditData((d) => ({ ...d, department: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
            <input
              type="url"
              value={editData.linkedinUrl}
              onChange={(e) => setEditData((d) => ({ ...d, linkedinUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Communication Style
            </label>
            <input
              type="text"
              value={editData.communicationStyle}
              onChange={(e) =>
                setEditData((d) => ({ ...d, communicationStyle: e.target.value }))
              }
              placeholder="e.g., Direct, Formal, Casual"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="doNotContact"
              checked={editData.doNotContact}
              onChange={(e) => setEditData((d) => ({ ...d, doNotContact: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="doNotContact" className="text-sm text-gray-700">
              Do Not Contact
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowEdit(false)}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
