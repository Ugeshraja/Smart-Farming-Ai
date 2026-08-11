import React from 'react';
import { X, Cpu, Sparkles, Activity, Layers, Database, MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react';
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
              <p className="text-xs text-gray-500">Final-Year ECE Project - Solanaceae Crop Disease & IoT Framework</p>
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
            <span className="font-bold text-agri-700">PROJECT TITLE:</span> “AI-Driven Unified Smart Farming Platform for Early Crop Disease Detection, Intelligent Farmer Advisory, and Sustainable Crop Management Using Explainable Deep Learning, RAG-LLM, and IoT”
          </div>

          {/* Pipeline 1: AI / ML Pipeline */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-5 h-5 text-agri-600" />
              <h3 className="text-base font-bold text-gray-900">1. AI/ML Disease Detection & RAG-LLM Pipeline (90% Focus)</h3>
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
                <span>RAG Agricultural Vector Retrieval</span>
                <ArrowRight className="w-4 h-4" />
                <span>LLM Farmer Advisory (English / தமிழ்)</span>
              </div>
            </div>
          </div>

          {/* Pipeline 2: IoT Pipeline */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-gray-900">2. Real-Time ESP32 IoT Monitoring Pipeline (10% Focus)</h3>
            </div>

            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-around text-center gap-3 text-xs sm:text-sm">
                <div className="bg-white px-3 py-2 rounded-lg border border-blue-100 shadow-2xs font-medium text-gray-700">
                  ESP32 Microcontroller
                </div>
                <ArrowRight className="w-4 h-4 text-blue-400" />
                <div className="bg-white px-3 py-2 rounded-lg border border-blue-100 shadow-2xs font-medium text-gray-700">
                  Soil Moisture, Temp, Humidity, Rain Sensors
                </div>
                <ArrowRight className="w-4 h-4 text-blue-400" />
                <div className="bg-white px-3 py-2 rounded-lg border border-blue-100 shadow-2xs font-medium text-gray-700">
                  FastAPI Backend / Recharts
                </div>
                <ArrowRight className="w-4 h-4 text-blue-400" />
                <div className="bg-emerald-600 text-white px-3 py-2 rounded-lg font-bold">
                  Dashboard Sensors Feed
                </div>
              </div>

              {/* Crucial Note */}
              <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-lg text-xs text-amber-900 flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Architectural Isolation:</strong> IoT ESP32 sensor telemetry is rendered directly on the Dashboard for environmental awareness. Sensor data does NOT flow into the YOLO11 / SAM / ResNet-50 visual leaf classifier.
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
                  <td className="p-3">Classifies specific leaf pathology (Late Blight, Early Blight, etc.)</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-gray-800">Explainability</td>
                  <td className="p-3 font-mono text-agri-700">LIME</td>
                  <td className="p-3">Generates visual feature heatmaps highlighting infected spots</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-gray-800">Advisory System</td>
                  <td className="p-3 font-mono text-agri-700">RAG + LLM</td>
                  <td className="p-3">Retrieves tailored agronomic treatment in English & Tamil</td>
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
