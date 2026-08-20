import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { axiosPublic } from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { motion } from 'framer-motion';
import { staggerChildren, fadeUp, listStagger } from '../../components/ui/motion';
import { ArrowLeft, Search, AlertTriangle, Stethoscope } from 'lucide-react';

const DoctorList = () => {
  const { token, roles } = useAuthStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  const { data: doctors, isLoading, error } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const response = await axiosPublic.get('/doctors');
      return response.data;
    }
  });

  const filteredDoctors = useMemo(() => {
    if (!doctors) return [];
    return doctors.filter(doc => {
      const matchSearch = doc.userId.toString().includes(searchTerm) || doc.specialty.toLowerCase().includes(searchTerm.toLowerCase()) || doc.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || doc.lastName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSpecialty = selectedSpecialty ? doc.specialty === selectedSpecialty : true;
      return matchSearch && matchSpecialty;
    });
  }, [doctors, searchTerm, selectedSpecialty]);

  const uniqueSpecialties = useMemo(() => {
    if (!doctors) return [];
    return [...new Set(doctors.map(d => d.specialty))].sort();
  }, [doctors]);

  const getBookLink = (doctorId) => {
    if (!token) return '/register';
    
    let path = '';
    if (roles.includes('ROLE_RECEPTION')) {
      path = `/reception/book/${doctorId}`;
    } else if (roles.includes('ROLE_PATIENT')) {
      path = `/patient/book/${doctorId}`;
    } else {
      return '/register';
    }

    const qs = searchParams.toString();
    return qs ? `${path}?${qs}` : path;
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] bg-red-50 text-red-700 p-8 rounded-2xl mx-auto max-w-2xl mt-12">
        <AlertTriangle aria-hidden="true" size={48} className="mb-4" />
        <h3 className="text-2xl font-bold mb-2">System Error</h3>
        <p className="text-red-600">Failed to load specialists at this time. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto relative">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-0 left-0 flex items-center text-gray-500 hover:text-indigo-600 transition-colors font-medium -mt-8 sm:mt-0"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back
        </button>

        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 mt-8 sm:mt-0">
          <span className="text-indigo-600 font-semibold tracking-wider uppercase text-sm mb-4 block">Our Specialists</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
            Meet Our Physicians
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Expert care tailored to you. Browse our network of premium healthcare professionals and schedule a consultation today.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 mb-12 max-w-4xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-gray-700 placeholder-gray-400"
              placeholder="Search by name or specialty..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="md:w-64">
            <select 
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-gray-700 appearance-none cursor-pointer"
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
            >
              <option value="">All Specialties</option>
              {uniqueSpecialties.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Doctor Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col items-center animate-pulse">
                <div className="w-24 h-24 bg-gray-200 rounded-full mb-6"></div>
                <div className="w-3/4 h-6 bg-gray-200 rounded-md mb-4"></div>
                <div className="w-1/2 h-4 bg-gray-200 rounded-md mb-8"></div>
                <div className="w-full h-10 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : filteredDoctors.length > 0 ? (
          <motion.div 
            variants={staggerChildren}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {filteredDoctors.map((doctor) => {
              const initials = `${doctor.firstName?.[0] || ''}${doctor.lastName?.[0] || ''}`;
              
              return (
                <motion.div 
                  key={doctor.id} 
                  variants={listStagger}
                  className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 flex flex-col items-center text-center group"
                >
                  <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mb-6 group-hover:bg-indigo-100 transition-colors">
                    {doctor.profileImageUrl ? (
                      <img loading="lazy" src={doctor.profileImageUrl} alt={`Dr. ${doctor.lastName}`} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-2xl font-bold text-indigo-700">{initials}</span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Dr. {doctor.firstName} {doctor.lastName}
                  </h3>
                  
                  <div className="mb-4">
                    <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase">
                      {doctor.specialty}
                    </span>
                  </div>
                  
                  <p className="text-gray-500 text-sm mb-8 line-clamp-2">
                    {doctor.qualifications || 'Board Certified Specialist'}
                  </p>
                  
                  <div className="mt-auto w-full">
                    <Link 
                      to={getBookLink(doctor.userId)} 
                      className="block w-full py-3 px-4 bg-white border-2 border-indigo-600 text-indigo-700 font-semibold rounded-xl hover:bg-indigo-600 hover:text-white transition-colors duration-200"
                    >
                      Book Consultation
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-3xl mx-auto text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Stethoscope className="text-gray-400 w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No specialists found</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              We couldn't find any doctors matching your search criteria. Try adjusting your filters to see more results.
            </p>
            <button 
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
              onClick={() => { setSearchTerm(''); setSelectedSpecialty(''); }}
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorList;
