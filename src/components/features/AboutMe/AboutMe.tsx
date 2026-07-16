import React from 'react';
import { motion } from 'motion/react';
import { User, Briefcase, GraduationCap, MapPin, Phone, Code, Building, Cpu, ExternalLink } from 'lucide-react';

export default function AboutMe() {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#151521]/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header Section with Image */}
        <div className="relative h-48 md:h-64 bg-gradient-to-r from-emerald-600 to-teal-700 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          
          <div className="absolute -bottom-16 left-8 md:left-12 flex items-end space-x-6">
            <div className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-white dark:border-gray-900 shadow-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img 
                  src="/umar_ali.png" 
                  alt="Umar Ali" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=Umar+Ali&background=0D8ABC&color=fff&size=256';
                  }}
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center" title="Online & Active">
                <div className="w-2.5 h-2.5 bg-white dark:bg-[#151521] rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-20 px-8 md:px-12 pb-12">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                👋 Hi, I'm Umar Ali
              </h1>
              <p className="mt-2 text-lg text-emerald-600 dark:text-emerald-400 font-medium">
                Entrepreneur, Software Developer & Digital Content Creator
              </p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span>Mardan, Khyber Pakhtunkhwa, Pakistan</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-500" />
                <span>+92 316 8432329</span>
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="prose prose-emerald dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                  I hold a <strong>Bachelor of Science (BSc) in Computer Science</strong> and have a strong passion for technology, innovation, and building practical digital solutions that solve real-world business problems.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  My expertise combines <strong>business management</strong> with <strong>modern software development</strong>, allowing me to understand both operational challenges and technical implementation. I enjoy creating scalable, user-friendly, and high-performance applications with a strong focus on clean UI/UX, productivity, and automation.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  As a <strong>vibe coder</strong>, I love transforming ideas into polished digital products using modern technologies, intelligent workflows, and creative design principles. I continuously explore new tools, frameworks, and AI-powered development techniques to deliver fast, efficient, and enterprise-grade solutions.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Alongside software development, I am an active <strong>video creator</strong>, producing educational and informative content related to technology, business, entrepreneurship, and digital innovation. I believe in sharing knowledge and helping others through engaging and valuable content.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Beyond technology, I manage multiple business ventures, giving me hands-on experience in operations, finance, customer management, and business growth. This real-world experience helps me design software that is practical, efficient, and tailored to actual business needs.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                  I am committed to continuous learning, innovation, and building products that make businesses smarter, faster, and more productive.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600" /> Personal Info
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <User className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Age</p>
                      <p className="text-gray-900 dark:text-white font-medium">26 Years (Married)</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Education</p>
                      <p className="text-gray-900 dark:text-white font-medium">BSc in Computer Science</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <Briefcase className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Profession</p>
                      <p className="text-gray-900 dark:text-white font-medium leading-tight">Businessman, Software Developer & Digital Content Creator</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/40 p-6 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-emerald-600" /> Specialization
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Mobile App Dev", "Enterprise Software", "UI/UX Design", 
                    "Business Automation", "AI-Assisted (Vibe) Coding"
                  ].map((skill, index) => (
                    <span 
                      key={index} 
                      className="px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
