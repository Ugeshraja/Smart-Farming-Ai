import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Eye,
  X,
  AlertCircle,
  Leaf
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { apiService } from '../services/apiService';

function HistoryThumbnail({ pred, isTa }) {
  const [failed, setFailed] = useState(false);
  const isInvalid = !pred?.imageUrl || pred.imageUrl.includes('localhost') || pred.imageUrl.includes('127.0.0.1');

  if (isInvalid || failed) {
    return (
      <div
        className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex flex-col items-center justify-center text-gray-400 p-0.5 text-center select-none"
        title={isTa ? 'படம் கிடைக்கவில்லை' : 'Image unavailable'}
      >
        <Leaf className="w-4 h-4 text-gray-400 mb-0.5" />
        <span className="text-[7.5px] leading-none font-medium text-gray-500">
          {isTa ? 'இல்லை' : 'No img'}
        </span>
      </div>
    );
  }

  return (
    <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
      <img
        src={pred.imageUrl}
        alt={pred.disease}
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function ModalLeafImage({ item, isTa }) {
  const [failed, setFailed] = useState(false);
  const isInvalid = !item?.imageUrl || item.imageUrl.includes('localhost') || item.imageUrl.includes('127.0.0.1');

  if (isInvalid || failed) {
    return (
      <div className="h-48 w-full flex flex-col items-center justify-center bg-gray-100 rounded-lg text-gray-400 p-4 space-y-1 text-center">
        <Leaf className="w-8 h-8 text-gray-400" />
        <span className="text-xs font-semibold text-gray-500">
          {isTa ? 'அசல் இலை படம் கிடைக்கவில்லை' : 'Image unavailable'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={item.imageUrl}
      alt="Leaf"
      className="h-48 w-full object-contain mx-auto"
      onError={() => setFailed(true)}
    />
  );
}

export default function PredictionHistory() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [predictions, setPredictions] = useState([]);
  const [filteredPredictions, setFilteredPredictions] = useState([]);
  const [selectedCropFilter, setSelectedCropFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState('All');
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const isTa = language === 'ta';

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      const data = await apiService.getPredictions();
      setPredictions(data);
      setFilteredPredictions(data);
      setLoading(false);
    }
    fetchHistory();
  }, []);

  useEffect(() => {
    let result = [...predictions];

    if (selectedCropFilter !== 'All') {
      result = result.filter(p => p.crop.toLowerCase() === selectedCropFilter.toLowerCase());
    }

    if (confidenceFilter !== 'All') {
      if (confidenceFilter === 'High') result = result.filter(p => p.confidence >= 95);
      if (confidenceFilter === 'Medium') result = result.filter(p => p.confidence >= 90 && p.confidence < 95);
      if (confidenceFilter === 'Low') result = result.filter(p => p.confidence < 90);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.disease.toLowerCase().includes(q) ||
        p.crop.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    }

    setFilteredPredictions(result);
  }, [selectedCropFilter, confidenceFilter, searchQuery, predictions]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
          {t('historyTitle')}
        </h2>
        <p className="text-xs sm:text-sm text-gray-600">
          {t('historySubtitle')}
        </p>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={isTa ? "தேடுங்கள்..." : "Search crop, disease, ID..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-agri-500"
            />
          </div>

          {/* Crop Filter */}
          <div>
            <select
              value={selectedCropFilter}
              onChange={(e) => setSelectedCropFilter(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-agri-500 font-medium"
            >
              <option value="All">{isTa ? 'எல்லா பயிர்களும்' : 'All Crops'}</option>
              <option value="Tomato">{isTa ? 'தக்காளி' : 'Tomato'}</option>
              <option value="Potato">{isTa ? 'உருளை' : 'Potato'}</option>
              <option value="Brinjal">{isTa ? 'கத்தரி' : 'Brinjal'}</option>
            </select>
          </div>

          {/* Confidence Filter */}
          <div>
            <select
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-agri-500 font-medium"
            >
              <option value="All">{isTa ? 'எல்லா நம்பகத்தன்மை நிலைகளும்' : 'All Confidence Scores'}</option>
              <option value="High">High Confidence (≥ 95%)</option>
              <option value="Medium">Medium Confidence (90% - 94%)</option>
              <option value="Low">Low Confidence (&lt; 90%)</option>
            </select>
          </div>

          {/* Result Count Indicator */}
          <div className="flex items-center justify-end font-semibold text-gray-500">
            <span>{filteredPredictions.length} records</span>
          </div>

        </div>
      </div>

      {/* Predictions Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-500">Loading prediction log...</div>
        ) : filteredPredictions.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 space-y-2">
            <AlertCircle className="w-8 h-8 text-gray-300 mx-auto" />
            <p>No matching crop predictions found in database.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Thumbnail</th>
                  <th className="py-3 px-4">ID & {t('dateLabel')}</th>
                  <th className="py-3 px-4">{t('cropLabel')}</th>
                  <th className="py-3 px-4">{t('diseaseLabel')}</th>
                  <th className="py-3 px-4">{t('confidenceLabel')}</th>
                  <th className="py-3 px-4">{t('statusLabel')}</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredPredictions.map((pred) => (
                  <tr key={pred.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Thumbnail */}
                    <td className="py-2.5 px-4">
                      <HistoryThumbnail pred={pred} isTa={isTa} />
                    </td>

                    {/* ID & Date */}
                    <td className="py-2.5 px-4">
                      <span className="font-mono font-bold text-gray-900 block">{pred.id}</span>
                      <span className="text-[11px] text-gray-400">{pred.createdAt}</span>
                    </td>

                    {/* Crop */}
                    <td className="py-2.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-agri-50 text-agri-700 font-bold border border-agri-200">
                        {pred.crop}
                      </span>
                    </td>

                    {/* Disease */}
                    <td className="py-2.5 px-4 font-bold text-gray-800">
                      {pred.disease}
                    </td>

                    {/* Confidence */}
                    <td className="py-2.5 px-4">
                      <span className="font-mono text-agri-700 font-bold">{pred.confidence}%</span>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-4">
                      {(() => {
                        const isHealthy = pred.status === 'Healthy' || pred.disease?.toLowerCase().includes('healthy');
                        const statusText = pred.status || (isHealthy ? (isTa ? 'ஆரோக்கியமானது' : 'Healthy') : (isTa ? 'நோய் கண்டறியப்பட்டது' : 'Disease Detected'));
                        return (
                          <span className={`inline-block whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-2xs ${
                            isHealthy
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-900 border border-amber-200'
                          }`}>
                            {statusText}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setActiveModalItem(pred)}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 inline mr-1" />
                        {t('viewDetails')}
                      </button>
                      <button
                        onClick={() => navigate(`/reports?id=${pred.id}`)}
                        className="px-2.5 py-1 bg-agri-600 hover:bg-agri-700 text-white rounded-lg font-semibold transition-colors shadow-2xs"
                      >
                        {t('viewReport')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Modal View */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-200 p-6 space-y-6">

            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-xs font-semibold text-gray-400 font-mono">{activeModalItem.id}</span>
                <h3 className="text-xl font-extrabold text-gray-900">{activeModalItem.disease}</h3>
              </div>
              <button
                onClick={() => setActiveModalItem(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image */}
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-center space-y-2 max-w-sm mx-auto">
              <span className="text-xs font-semibold text-gray-600 block">{isTa ? 'அசல் இலை படம்' : 'Original Leaf Photo'}</span>
              <ModalLeafImage item={activeModalItem} isTa={isTa} />
            </div>

            {/* Metadata */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-gray-400 block">{t('cropLabel')}</span>
                <strong className="text-gray-800">{activeModalItem.crop}</strong>
              </div>
              <div>
                <span className="text-gray-400 block">{t('confidenceLabel')}</span>
                <strong className="text-agri-700">{activeModalItem.confidence}%</strong>
              </div>
              <div>
                <span className="text-gray-400 block">Processing Time</span>
                <strong className="text-gray-800 font-mono text-xs">{activeModalItem.processingTime || '1.18 sec'}</strong>
              </div>
              <div>
                <span className="text-gray-400 block">{t('dateLabel')}</span>
                <strong className="text-gray-800 font-mono">{activeModalItem.createdAt}</strong>
              </div>
            </div>

            {/* Advisory */}
            <div className="bg-agri-50 border border-agri-200 p-4 rounded-xl space-y-2 text-xs">
              <h4 className="font-bold text-agri-900 uppercase">{t('advisoryLabel')}</h4>
              <p className="text-agri-900 leading-relaxed">
                {isTa ? activeModalItem.advisory.ta : activeModalItem.advisory.en}
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setActiveModalItem(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const id = activeModalItem.id;
                  setActiveModalItem(null);
                  navigate(`/reports?id=${id}`);
                }}
                className="px-4 py-2 bg-agri-600 hover:bg-agri-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                {t('generateReport')}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
