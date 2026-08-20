import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { axiosPrivate } from '../../api/axios';
import { BedDouble } from 'lucide-react';
import { staggerChildren, fadeIn } from '../../components/ui/motion';



const STATUS_COLORS = {
  AVAILABLE: 'bg-[var(--color-success-bg)] text-[var(--color-success)] border-[var(--color-success)]/30',
  OCCUPIED: 'bg-[var(--color-danger-bg)] text-[var(--color-danger)] border-[var(--color-danger)]/30',
  CLEANING: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border-[var(--color-warning)]/30',
  MAINTENANCE: 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] border-[var(--color-border)]',
  RESERVED: 'bg-[var(--color-info-bg)] text-[var(--color-info)] border-[var(--color-info)]/30'
};

const BedStatusBoard = () => {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: wards, isLoading: wardsLoading } = useQuery({
    queryKey: ['wards'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/inpatient/wards');
      return res.data;
    }
  });

  const { data: beds, isLoading: bedsLoading } = useQuery({
    queryKey: ['beds', filterStatus],
    queryFn: async () => {
      let url = '/inpatient/beds';
      if (filterStatus !== 'ALL') {
        url += `?status=${filterStatus}`;
      }
      const res = await axiosPrivate.get(url);
      return res.data;
    }
  });

  if (wardsLoading || bedsLoading) {
    return <div className="p-10 flex justify-center text-[var(--color-text-muted)]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-navy-800)]"></div></div>;
  }

  // Group beds by Ward then by Room
  const bedsByWard = {};
  
  if (beds && wards) {
    // Initialize wards
    wards.forEach(w => {
      bedsByWard[w.id] = { ...w, rooms: {} };
    });

    beds.forEach(bed => {
      const roomId = bed.room.id;
      const wardId = bed.room.ward.id;
      
      if (bedsByWard[wardId]) {
        if (!bedsByWard[wardId].rooms[roomId]) {
          bedsByWard[wardId].rooms[roomId] = { ...bed.room, beds: [] };
        }
        
        // Search filter
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          if (bed.bedNumber.toLowerCase().includes(term) || 
              bed.room.roomNumber.toLowerCase().includes(term)) {
            bedsByWard[wardId].rooms[roomId].beds.push(bed);
          }
        } else {
          bedsByWard[wardId].rooms[roomId].beds.push(bed);
        }
      }
    });
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerChildren} className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[var(--color-navy-900)] flex items-center gap-2 m-0">
            <BedDouble className="text-[var(--color-navy-800)]" />
            Bed Status Board
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm m-0 mt-1">Live overview of ward and bed availability.</p>
        </div>
        
        <div className="flex items-center gap-3">
           {/* Filters */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
            <input 
              type="text"
              placeholder="Search room or bed..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-9 w-48"
            />
          </div>
          <div className="flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2">
            <Filter className="text-[var(--color-text-muted)]" size={18} />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm outline-none bg-transparent text-[var(--color-text)] font-medium cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="CLEANING">Cleaning</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      {Object.values(bedsByWard).length === 0 ? (
        <EmptyState 
          icon={BedDouble}
          title="No Wards Configured"
          description="There are no wards or beds set up in the system yet."
        />
      ) : (
        <div className="space-y-8">
          {Object.values(bedsByWard).map(ward => {
            const rooms = Object.values(ward.rooms);
            // Hide empty wards if we are filtering
            if (rooms.length === 0 && (filterStatus !== 'ALL' || searchTerm)) return null;
            
            return (
              <motion.div variants={fadeIn} key={ward.id} className="bg-[var(--color-surface)] rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden">
                <div className="bg-[var(--color-surface-alt)] px-6 py-4 border-b border-[var(--color-border)] flex justify-between items-center">
                  <div>
                    <h2 className="font-bold text-lg text-[var(--color-navy-900)] m-0">{ward.name}</h2>
                    <p className="text-xs text-[var(--color-text-muted)] m-0">{ward.wardType.replace(/_/g, ' ')} • Floor {ward.floor}</p>
                  </div>
                </div>
                
                <div className="p-6">
                  {rooms.length === 0 ? (
                    <p className="text-[var(--color-text-muted)] text-sm italic">No beds match the current filters in this ward.</p>
                  ) : (
                    <div className="space-y-6">
                      {rooms.map(room => {
                        if (room.beds.length === 0) return null;
                        
                        return (
    
                          <div key={room.id}>
                            <h4 className="text-sm font-semibold text-[var(--color-navy-800)] mb-3 flex items-center gap-2">
                              Room {room.roomNumber}
                              <span className="text-xs font-normal px-2 py-0.5 bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-full text-[var(--color-text-muted)]">
                                {room.roomType.replace(/_/g, ' ')}
                              </span>
                            </h4>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                              {room.beds.map(bed => (
                                <div 
                                  key={bed.id} 
                                  className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer ${STATUS_COLORS[bed.status] || STATUS_COLORS.MAINTENANCE}`}
                                  title={`Bed: ${bed.bedNumber} - Status: ${bed.status}`}
                                >
                                  <BedDouble size={24} />
                                  <div className="text-center">
                                    <p className="font-bold text-sm m-0">Bed {bed.bedNumber}</p>
                                    <p className="text-[10px] uppercase font-bold tracking-wider opacity-80 m-0 mt-1">{bed.status}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

    </motion.div>
    
  );
};

export default BedStatusBoard;
