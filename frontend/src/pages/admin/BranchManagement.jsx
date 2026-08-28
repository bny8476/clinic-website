import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import Modal from '../../components/ui/Modal';
import DataTable from '../../components/ui/DataTable';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { 
    Building2, 
    Edit2, 
    Phone, 
    Plus, 
    MapPin, 
    Mail, 
    Globe, 
    Clock, 
    Map, 
    Search,
    CheckCircle2,
    XCircle,
    SlidersHorizontal,
    Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '../../components/ui/Badge';
import { fadeIn } from '../../components/ui/motion';
import toast from 'react-hot-toast';

const TIMEZONE_OPTIONS = [
    { label: 'Coordinated Universal Time (UTC)', value: 'UTC' },
    { label: 'Eastern Time (US & Canada) (America/New_York)', value: 'America/New_York' },
    { label: 'Central Time (US & Canada) (America/Chicago)', value: 'America/Chicago' },
    { label: 'Pacific Time (US & Canada) (America/Los_Angeles)', value: 'America/Los_Angeles' },
    { label: 'London, UK (Europe/London)', value: 'Europe/London' },
    { label: 'Dubai, UAE (Asia/Dubai)', value: 'Asia/Dubai' },
    { label: 'India Standard Time (Asia/Kolkata)', value: 'Asia/Kolkata' },
    { label: 'Tokyo, Japan (Asia/Tokyo)', value: 'Asia/Tokyo' },
    { label: 'Sydney, Australia (Australia/Sydney)', value: 'Australia/Sydney' }
];

const INITIAL_FORM_STATE = {
    name: '',
    email: '',
    phoneNumber: '',
    timezone: 'UTC',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    isActive: true
};

const BranchManagement = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentBranch, setCurrentBranch] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);

    const { data: branches = [], isLoading } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const res = await axiosPrivate.get('/branches');
            return res.data;
        }
    });

    const mutation = useMutation({
        mutationFn: async (branchData) => {
            if (branchData.id) {
                const res = await axiosPrivate.put(`/branches/${branchData.id}`, branchData);
                return res.data;
            } else {
                const res = await axiosPrivate.post('/branches', branchData);
                return res.data;
            }
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['branches']);
            toast.success(currentBranch ? 'Branch updated successfully!' : 'Branch created successfully!');
            setIsModalOpen(false);
            setCurrentBranch(null);
            setFormData(INITIAL_FORM_STATE);
        },
        onError: (error) => {
            const msg = error.response?.data?.message || 'Failed to save branch details. Please check all fields.';
            toast.error(msg);
        }
    });

    const handleEdit = (branch) => {
        setCurrentBranch(branch);
        setFormData({
            ...INITIAL_FORM_STATE,
            ...branch,
            state: branch.state || ''
        });
        setIsModalOpen(true);
    };

    const handleCreateNew = () => {
        setCurrentBranch(null);
        setFormData(INITIAL_FORM_STATE);
        setIsModalOpen(true);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validation check
        if (!formData.name.trim()) {
            toast.error('Branch Name is required');
            return;
        }
        if (!formData.city.trim()) {
            toast.error('City is required');
            return;
        }
        if (!formData.country.trim()) {
            toast.error('Country is required');
            return;
        }
        mutation.mutate(formData);
    };

    const filteredBranches = branches.filter(b => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            b.name?.toLowerCase().includes(term) ||
            b.city?.toLowerCase().includes(term) ||
            b.state?.toLowerCase().includes(term) ||
            b.country?.toLowerCase().includes(term) ||
            b.email?.toLowerCase().includes(term)
        );
    });

    const totalCount = branches.length;
    const activeCount = branches.filter(b => b.isActive).length;
    const citiesCount = new Set(branches.map(b => b.city).filter(Boolean)).size;

    const columns = [
        { 
            key: 'name', 
            title: 'Branch Name', 
            render: (val, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                        <Building2 size={18} />
                    </div>
                    <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{val}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Mail size={12} />
                            {row.email || 'No email provided'}
                        </div>
                    </div>
                </div>
            ) 
        },
        { 
            key: 'location', 
            title: 'Location', 
            render: (_, row) => (
                <div className="text-sm">
                    <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <MapPin size={14} className="text-rose-500" />
                        {row.city}{row.state ? `, ${row.state}` : ''}, {row.country}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[200px]">
                        {row.address}
                    </div>
                </div>
            ) 
        },
        { 
            key: 'phoneNumber', 
            title: 'Contact Phone',
            render: (val) => val ? (
                <div className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-mono">
                    <Phone size={14} className="text-emerald-500" />
                    {val}
                </div>
            ) : <span className="text-xs text-slate-400">—</span>
        },
        { 
            key: 'timezone', 
            title: 'Timezone',
            render: (val) => (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono">
                    <Clock size={12} className="text-indigo-500" />
                    {val || 'UTC'}
                </span>
            )
        },
        {
            key: 'isActive',
            title: 'Status',
            render: (val) => (
                <Badge variant={val ? 'success' : 'danger'} className="gap-1">
                    {val ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {val ? 'Active' : 'Inactive'}
                </Badge>
            )
        },
        {
            key: 'actions',
            title: 'Actions',
            align: 'right',
            render: (_, row) => (
                <button
                    onClick={() => handleEdit(row)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 hover:border-blue-200 transition-all text-xs font-medium flex items-center gap-1.5 ml-auto"
                    title="Edit Branch"
                >
                    <Edit2 size={14} />
                    Edit
                </button>
            )
        }
    ];

    return (
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-white/10 relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-semibold mb-3">
                        <Sparkles size={14} />
                        Enterprise Infrastructure
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold font-display m-0 flex items-center gap-3">
                        Branch Management
                    </h1>
                    <p className="text-sm text-slate-300 m-0 mt-1 max-w-xl">
                        Configure physical clinic locations, regional settings, contact channels, and operational timezones.
                    </p>
                </div>
                <div className="relative z-10 flex items-center gap-3">
                    <button 
                        onClick={handleCreateNew} 
                        className="bg-[#2160FF] hover:bg-[#1b52dc] text-white px-5 py-2.5 rounded-xl shadow-md font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer border-0"
                        style={{ backgroundColor: '#2160FF' }}
                    >
                        <Plus size={18} />
                        Add Branch
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalCount}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Registered Branches</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{activeCount}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Operating Locations</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
                        <Globe size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{citiesCount}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cities Served</div>
                    </div>
                </div>
            </div>

            {/* Filter and Table Container */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/30">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search branch name, city, state..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                        Showing {filteredBranches.length} of {totalCount} branches
                    </div>
                </div>

                <DataTable 
                    columns={columns} 
                    data={filteredBranches} 
                    isLoading={isLoading} 
                    emptyTitle="No branches found matching your search."
                />
            </div>

            {/* Redesigned Premium Create / Edit Branch Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                size="lg"
            >
                <div className="-mx-6 -mt-6 px-6 py-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center font-bold">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold font-display m-0 text-white">
                                {currentBranch ? 'Edit Branch Location' : 'Create New Branch'}
                            </h2>
                            <p className="text-xs text-slate-300 m-0 mt-0.5">
                                Enter contact, address, and operational details for this clinic location.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                    {/* Section 1: Basic Information */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                            <Building2 size={14} className="text-blue-500" />
                            General Information
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Branch Name <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        name="name" 
                                        value={formData.name} 
                                        onChange={handleChange} 
                                        required 
                                        placeholder="e.g. City Care Downtown Medical Center"
                                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Branch Email <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="email" 
                                        name="email" 
                                        value={formData.email} 
                                        onChange={handleChange} 
                                        required 
                                        placeholder="downtown@clinic.com"
                                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Contact Phone <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        name="phoneNumber" 
                                        value={formData.phoneNumber} 
                                        onChange={handleChange} 
                                        required 
                                        placeholder="+12345678901"
                                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono" 
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Operating Timezone <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select 
                                        name="timezone" 
                                        value={formData.timezone} 
                                        onChange={handleChange} 
                                        required 
                                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                                    >
                                        {TIMEZONE_OPTIONS.map(tz => (
                                            <option key={tz.value} value={tz.value}>
                                                {tz.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Location & Address */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                            <MapPin size={14} className="text-rose-500" />
                            Location & Address
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Street Address <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                    <textarea 
                                        name="address" 
                                        rows="2"
                                        value={formData.address} 
                                        onChange={handleChange} 
                                        required 
                                        placeholder="123 Medical Center Blvd, Suite 400"
                                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none" 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    City <span className="text-rose-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    name="city" 
                                    value={formData.city} 
                                    onChange={handleChange} 
                                    required 
                                    placeholder="e.g. New York"
                                    className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    State / Province <span className="text-rose-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    name="state" 
                                    value={formData.state} 
                                    onChange={handleChange} 
                                    required 
                                    placeholder="e.g. NY"
                                    className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Country <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        name="country" 
                                        value={formData.country} 
                                        onChange={handleChange} 
                                        required 
                                        placeholder="e.g. USA"
                                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Postal / ZIP Code <span className="text-rose-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    name="postalCode" 
                                    value={formData.postalCode} 
                                    onChange={handleChange} 
                                    required 
                                    placeholder="e.g. 10001"
                                    className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Status Toggle */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-4">
                        <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                Active Operational Branch
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Active branches are available for patient appointments, inventory, and staff assignment.
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                name="isActive" 
                                checked={formData.isActive} 
                                onChange={handleChange} 
                                className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-slate-600 peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>

                    {/* Modal Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Button 
                            type="button" 
                            variant="secondary" 
                            onClick={() => setIsModalOpen(false)}
                            className="px-5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700"
                        >
                            Cancel
                        </Button>
                        <button 
                            type="submit" 
                            disabled={mutation.isPending}
                            className="bg-[#2160FF] hover:bg-[#1b52dc] text-white px-6 py-2.5 text-xs font-bold rounded-xl shadow-lg shadow-blue-600/25 border-0 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
                            style={{ backgroundColor: '#2160FF' }}
                        >
                            {mutation.isPending ? 'Saving...' : (currentBranch ? 'Save Changes' : 'Create Branch')}
                        </button>
                    </div>
                </form>
            </Modal>
        </motion.div>
    );
};

export default BranchManagement;
