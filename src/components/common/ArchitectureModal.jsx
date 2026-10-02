import React from 'react';
import { X, Cpu, Sparkles, CloudSun, CalendarDays, Database, MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function ArchitectureModal({ isOpen, onClose }) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200">
        
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-agri-100 flex items-center justify-center text-agri-600">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">System Architecture & AI Pipeline</h2>
              <p className="text-xs text-gray-500">Unified Software Platform - Solanaceae Crop Disease & AI Advisory Framework</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-8">

          {/* Project Title Banner */}
          <div className="bg-agri-50 border border-agri-200 rounded-xl p-4 text-xs sm:text-sm text-agri-900 leading-relaxed font-medium">
            <span className="font-bold text-agri-700">PROJECT TITLE:</span> “AI-Driven Unified Smart Farming Platform for Early Crop Disease Detection, Intelligent Farmer Advisory, and Sustainable Crop Management Using Explainable Deep Learning, RAG-LLM, and Weather Intelligence”
          </div>

          {/* Pipeline 1: AI / ML Disease Detection Pipeline */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-5 h-5 text-agri-600" />
              <h3 className="text-base font-bold text-gray-900">1. AI/ML Disease Detection & Explainable Vision Pipeline</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
              {/* Step 1 */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative group hover:border-agri-500 transition-colors">
                <div className="w-8 h-8 rounded-full bg-agri-600 text-white font-bold text-sm flex items-center justify-center mx-auto mb-2">1</div>
                <div className="font-semibold text-gray-800 text-sm mb-1">YOLO11</div>
                <div className="text-xs text-gray-500">Leaf Detection & Bounding Box</div>
              </div>

              {/* Step 2 */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative group hover:border-agri-500 transition-colors">
                <div className="w-8 h-8 rounded-full bg-agri-600 text-white font-bold text-sm flex items-center justify-center mx-auto mb-2">2</div>
                <div className="font-semibold text-gray-800 text-sm mb-1">SAM</div>
                <div className="text-xs text-gray-500">Segment Anything Model</div>
              </div>

              {/* Step 3 */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative group hover:border-agri-500 transition-colors">
                <div className="w-8 h-8 rounded-full bg-agri-600 text-white font-bold text-sm flex items-center justify-center mx-auto mb-2">3</div>
                <div className="font-semibold text-gray-800 text-sm mb-1">ResNet-50</div>
                <div className="text-xs text-gray-500">Disease Classification</div>
              </div>

              {/* Step 4 */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative group hover:border-agri-500 transition-colors">
                <div className="w-8 h-8 rounded-full bg-agri-600 text-white font-bold text-sm flex items-center justify-center mx-auto mb-2">4</div>
                <div className="font-semibold text-gray-800 text-sm mb-1">LIME</div>
                <div className="text-xs text-gray-500">Explainable Heatmap</div>
              </div>
            </div>

            {/* RAG-LLM Connector */}
            <div className="my-4 flex items-center justify-center">
              <div className="bg-emerald-100 text-emerald-800 text-xs px-4 py-1.5 rounded-full font-semibold flex items-center space-x-2 border border-emerald-300">
                <span>Disease Output</span>
                <ArrowRight className="w-4 h-4" />
                <span>RAG Agricultural Knowledge Base</span>
                <ArrowRight className="w-4 h-4" />
                <span>Gemini LLM Advisory (English & தமிழ்)</span>
              </div>
            </div>
          </div>

          {/* Pipeline 2: Software-Only Multimodal Architecture */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Database className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-gray-900">2. Software-Only Multimodal AI Architecture Flow</h3>
            </div>

            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center text-xs">
                {/* Farmer Input */}
                <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs space-y-1">
                  <div className="font-bold text-gray-900">Farmer Input</div>
                  <p className="text-[11px] text-gray-500">Image, Text or Tamil/English Voice</p>
                </div>

                {/* AI Services */}
                <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs space-y-1">
                  <div className="font-bold text-gray-900">AI Disease Engine</div>
                  <p className="text-[11px] text-gray-500">YOLO11 → SAM → ResNet-50 → LIME</p>
                </div>

                {/* Weather & Knowledge */}
                <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs space-y-1">
                  <div className="font-bold text-gray-900">Context Intelligence</div>
                  <p className="text-[11px] text-gray-500">Weather API + RAG Knowledge Base</p>
                </div>

                {/* Gemini LLM */}
                <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs space-y-1">
                  <div className="font-bold text-gray-900">Gemini LLM</div>
                  <p className="text-[11px] text-gray-500">Contextual Reasoning & Guidance</p>
                </div>

                {/* Advisory Delivery */}
                <div className="bg-emerald-600 text-white p-3 rounded-xl font-bold shadow-2xs flex flex-col justify-center">
                  <span>Farmer Advisory</span>
                  <span className="text-[10px] font-normal text-emerald-100 mt-0.5">Tamil / English Speech & Web UI</span>
                </div>
              </div>

              {/* Architecture Scope Callout */}
              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded-r-lg text-xs text-emerald-900 flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Software-Only Architecture:</strong> The entire platform operates purely as a software-based AI system utilizing deep learning computer vision, external meteorological APIs, RAG agricultural databases, and neural large language models.
                </div>
              </div>
            </div>
          </div>

          {/* Model Summary Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="p-3">Component</th>
                  <th className="p-3">Technology / Model</th>
                  <th className="p-3">Role & Output</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-600">
                <tr>
                  <td className="p-3 font-medium text-gray-800">Leaf Detection</td>
                  <td className="p-3 font-mono text-agri-700">YOLO11</td>
                  <td className="p-3">Detects Solanaceae leaf region in uploaded frame</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-gray-800">Segmentation</td>
                  <td className="p-3 font-mono text-agri-700">SAM (Segment Anything)</td>
                  <td className="p-3">Isolates precise leaf mask from background clutter</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-gray-800">Classification</td>
                  <td className="p-3 font-mono text-agri-700">ResNet-50</td>
                  <td className="p-3">Classifies specific leaf pathology across 13 distinct classes</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-gray-800">Explainability</td>
                  <td className="p-3 font-mono text-agri-700">LIME</td>
                  <td className="p-3">Generates visual feature heatmaps highlighting infected spots</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-gray-800">Advisory System</td>
                  <td className="p-3 font-mono text-agri-700">RAG + Gemini LLM</td>
                  <td className="p-3">Retrieves tailored agronomic treatment in English & Tamil</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-gray-800">Weather Intelligence</td>
                  <td className="p-3 font-mono text-agri-700">OpenWeather API</td>
                  <td className="p-3">Delivers microclimate forecasting & agricultural risk alerts</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-gray-800">Farming Planner</td>
                  <td className="p-3 font-mono text-agri-700">Agronomic Rules Engine</td>
                  <td className="p-3">Manages crop stages, sowing-to-harvest timelines & tasks</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 border-t border-gray-100 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-agri-600 hover:bg-agri-700 text-white font-medium text-sm rounded-lg transition-colors shadow-xs"
          >
            Close Architecture Summary
          </button>
        </div>

      </div>
    </div>
  );
}
