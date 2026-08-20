import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';

const DoctorAiWorkspace = ({ encounterId }) => {
    const [summary, setSummary] = useState(null);
    const [isApproved, setIsApproved] = useState(false);
    
    // Mock IDs
    const doctorId = 2;
    const tenantId = 1;

    const generateSummary = useMutation({
        mutationFn: async () => {
            return (await axiosPrivate.post(`/ai/doctor/summarize-encounter?encounterId=${encounterId}&doctorId=${doctorId}&tenantId=${tenantId}`)).data;
        },
        onSuccess: (data) => {
            setSummary(data);
            setIsApproved(false);
        }
    });

    const approveSummary = useMutation({
        mutationFn: async () => {
            return await axiosPrivate.post(`/ai/doctor/approve-summary?encounterId=${encounterId}&doctorId=${doctorId}&tenantId=${tenantId}`);
        },
        onSuccess: () => {
            setIsApproved(true);
        }
    });

    return (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4 border-b border-[var(--color-border)] pb-2">
                <Bot className="text-[var(--color-primary)]" />
                <h3 className="font-bold text-lg m-0">Clinical AI Workspace</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto flex flex-col gap-4">
                <p className="text-sm text-[var(--color-text-muted)]">
                    Use AI to draft clinical notes, summarize patient history, or review drug interactions. 
                    <strong className="text-red-500 ml-1">Always review AI outputs.</strong>
                </p>

                <Button 
                    onClick={() => generateSummary.mutate()} 
                    disabled={generateSummary.isLoading}
                    className="w-full flex items-center justify-center gap-2"
                >
                    <FileText size={16} /> 
                    {generateSummary.isLoading ? 'Generating...' : 'Generate Encounter Summary'}
                </Button>

                {summary && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm">
                        <div className="flex items-center gap-2 text-blue-800 font-bold mb-2">
                            <Bot size={16} /> AI Draft
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap m-0">{summary}</p>
                        
                        {!isApproved ? (
                            <div className="mt-4 flex gap-2">
                                <Button size="sm" variant="success" onClick={() => approveSummary.mutate()} className="flex-1">
                                    <Check size={16} /> Approve & Save
                                </Button>
                                <Button size="sm" variant="danger" onClick={() => setSummary(null)} className="flex-1">
                                    <X size={16} /> Reject
                                </Button>
                            </div>
                        ) : (
                            <div className="mt-4 flex items-center gap-2 text-green-700 font-bold bg-green-100 p-2 rounded-lg">
                                <ShieldAlert size={16} /> Saved to immutable audit log.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
export default DoctorAiWorkspace;
