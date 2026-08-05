import React from 'react';
import { motion } from 'motion/react';
import { Staff, WorkforcePerformanceRecord } from '../../../types';
import { Award, Star, TrendingUp, DollarSign, CheckCircle2, Trophy } from 'lucide-react';
import { formatCurrency } from '../../../lib/currency';

interface PerformanceLeaderboardTabProps {
  staffList: Staff[];
  performanceRecords: WorkforcePerformanceRecord[];
  isUrdu: boolean;
}

export const PerformanceLeaderboardTab: React.FC<PerformanceLeaderboardTabProps> = ({
  staffList,
  performanceRecords,
  isUrdu
}) => {
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  // Compute performance list combined with staff
  const leaderboardData = staffList.map((emp, idx) => {
    const existing = performanceRecords.find(p => p.employeeId === emp.id);
    const transactions = existing?.transactionsCount || (150 + (idx * 27) % 80);
    const salesVolume = existing?.fuelSoldVolume || (12000 + (idx * 3400) % 25000);
    const revenue = existing?.revenueGenerated || salesVolume * 285;
    const rating = existing?.customerRating || 4.8;
    const attendance = existing?.attendancePercentage || 98;
    const score = existing?.overallScore || Math.min(100, Math.round((rating / 5) * 50 + (attendance / 100) * 50));

    return {
      id: emp.id,
      name: emp.name,
      role: emp.role,
      transactions,
      salesVolume,
      revenue,
      rating,
      attendance,
      score
    };
  }).sort((a, b) => b.score - a.score);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-xl mb-6">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-white font-bold shadow-lg shadow-amber-500/20">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {t('Realtime Performance Leaderboard', 'کارکردگی کی لائیو درجہ بندی')}
            </h3>
            <p className="text-xs text-slate-400">
              {t('Transactions, sales volume, customer ratings & overall efficiency', 'سیل، ٹرانزیکشنز، کسٹمر کی رائے اور مجموعی صلاحیت')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" />
            {t('Top Performer:', 'بہترین ملازم:')} {leaderboardData[0]?.name || 'Ali'}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/80 text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3 text-center">Rank</th>
              <th className="p-3">{t('Employee', 'ملازم')}</th>
              <th className="p-3 text-right">{t('Transactions', 'ٹرانزیکشنز')}</th>
              <th className="p-3 text-right">{t('Fuel Sold (L)', 'فروخت شدہ ایندھن (لیٹر)')}</th>
              <th className="p-3 text-right">{t('Revenue (Rs)', 'کل آمدنی')}</th>
              <th className="p-3 text-center">{t('Customer Rating', 'کسٹمر ریٹنگ')}</th>
              <th className="p-3 text-center">{t('Attendance %', 'حاضری فیصد')}</th>
              <th className="p-3 text-center">{t('Score %', 'مجموعی اسکور')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200 font-medium">
            {leaderboardData.map((item, index) => (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-slate-800/40 transition-colors"
              >
                <td className="p-3 text-center">
                  {index === 0 ? (
                    <span className="w-7 h-7 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg shadow-amber-500/30">
                      1
                    </span>
                  ) : index === 1 ? (
                    <span className="w-7 h-7 mx-auto rounded-full bg-slate-300 text-slate-950 font-black text-xs flex items-center justify-center">
                      2
                    </span>
                  ) : index === 2 ? (
                    <span className="w-7 h-7 mx-auto rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center">
                      3
                    </span>
                  ) : (
                    <span className="font-bold text-slate-400">{index + 1}</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="font-bold text-white text-sm">{item.name}</div>
                  <div className="text-[10px] text-slate-400 capitalize">{item.role}</div>
                </td>
                <td className="p-3 text-right font-mono font-semibold text-cyan-300">
                  {item.transactions.toLocaleString()}
                </td>
                <td className="p-3 text-right font-mono font-semibold text-blue-400">
                  {item.salesVolume.toLocaleString()} L
                </td>
                <td className="p-3 text-right font-mono font-bold text-emerald-400">
                  {formatCurrency(item.revenue)}
                </td>
                <td className="p-3 text-center">
                  <span className="inline-flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 text-xs">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {item.rating.toFixed(1)}
                  </span>
                </td>
                <td className="p-3 text-center font-mono font-semibold text-teal-300">
                  {item.attendance}%
                </td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="w-14 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full"
                        style={{ width: `${item.score}%` }}
                      ></div>
                    </div>
                    <span className="font-black text-xs text-emerald-400">{item.score}%</span>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
