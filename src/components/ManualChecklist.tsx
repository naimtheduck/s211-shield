import { useState } from 'react';

import { ChevronDown, ChevronRight, Check, Info } from 'lucide-react';

import { useAuditStore } from '../lib/store';

import { t } from '../lib/translations';

import { checklistConfig, ChecklistSection, ChecklistQuestion } from '../lib/checklist-config';



interface ManualChecklistProps {

  onSave: (data: Record<string, unknown>) => void;

}



export function ManualChecklist({ onSave }: ManualChecklistProps) {

  const language = useAuditStore((state) => state.language);

  const checklistData = useAuditStore((state) => state.checklistData);

 

  const [expandedSections, setExpandedSections] = useState<Set<string>>(

    new Set() // <-- Default to collapsed

  );



  const [formData, setFormData] = useState<Record<string, unknown>>(checklistData);

  const [saving, setSaving] = useState(false);

  const [saved, setSaved] = useState(false);



  const toggleSection = (sectionId: string) => {

    const newExpanded = new Set(expandedSections);

    if (newExpanded.has(sectionId)) {

      newExpanded.delete(sectionId);

    } else {

      newExpanded.add(sectionId);

    }

    setExpandedSections(newExpanded);

  };



  const handleInputChange = (questionId: string, value: unknown) => {

    setFormData((prev) => ({

      ...prev,

      [questionId]: value,

    }));

  };



  const handleCheckboxChange = (questionId: string, optionValue: string, isChecked: boolean) => {

    setFormData((prev) => {

      const currentValues = (prev[questionId] as Record<string, boolean>) || {};

      return {

        ...prev,

        [questionId]: {

          ...currentValues,

          [optionValue]: isChecked,

        },

      };

    });

  };



  const handleSave = async () => {

    setSaving(true);

    await onSave(formData);

    setSaving(false);

    setSaved(true);

    setTimeout(() => setSaved(false), 2000);

  };



  const InfoTooltip = ({ info }: { info?: string }) => {

    if (!info) return null;

    return (

      <div className="group relative flex items-center">

        <Info className="w-4 h-4 text-gray-400 cursor-help" />

        <span className="absolute left-6 w-72 p-2 text-xs text-white bg-gray-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">

          {info}

        </span>

      </div>

    );

  };



  const renderLabel = (label: string, info?: string) => (

    <div className="flex items-center space-x-2 mb-1">

      <label className="font-medium text-gray-900">

        {label}

      </label>

      <InfoTooltip info={info} />

    </div>

  );



  const renderQuestion = (question: ChecklistQuestion) => {

    const value = formData[question.id];

    const label = language === 'en' ? question.labelEn : question.labelFr;

    const info = language === 'en' ? question.infoEn : question.infoFr;



    if (question.type === 'radio' && question.options) {

      return (

        <div key={question.id} className="mb-6">

          {renderLabel(label, info)}

          <div className="space-y-2">

            {question.options.map((option) => (

              <label key={option.value} className="flex items-center cursor-pointer group">

                <input

                  type="radio"

                  name={question.id}

                  value={option.value}

                  checked={value === option.value}

                  onChange={(e) => handleInputChange(question.id, e.target.value)}

                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"

                />

                <span className="ml-3 text-gray-700 group-hover:text-gray-900">

                  {language === 'en' ? option.labelEn : option.labelFr}

                </span>

              </label>

            ))}

          </div>

        </div>

      );

    }



    if (question.type === 'checkbox' && question.options) {

      return (

        <div key={question.id} className="mb-6">

          {renderLabel(label, info)}

          <div className="space-y-2">

            {question.options.map((option) => (

              <label key={option.value} className="flex items-center cursor-pointer group">

                <input

                  type="checkbox"

                  name={`${question.id}-${option.value}`}

                  checked={!!(value as Record<string, boolean>)?.[option.value]}

                  onChange={(e) => handleCheckboxChange(question.id, option.value, e.target.checked)}

                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"

                />

                <span className="ml-3 text-gray-700 group-hover:text-gray-900">

                  {language === 'en' ? option.labelEn : option.labelFr}

                </span>

              </label>

            ))}

          </div>

        </div>

      );

    }



    if (question.type === 'text') {

      return (

        <div key={question.id} className="mb-6">

          {renderLabel(label, info)}

          <input

            type="text"

            value={(value as string) || ''}

            onChange={(e) => handleInputChange(question.id, e.target.value)}

            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"

          />

        </div>

      );

    }

   

    if (question.type === 'textarea') {

      return (

        <div key={question.id} className="mb-6">

          {renderLabel(label, info)}

          <textarea

            value={(value as string) || ''}

            onChange={(e) => handleInputChange(question.id, e.target.value)}

            className="w-full h-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"

            placeholder={language === 'en' ? 'Paste your policy here...' : 'Collez votre politique ici...'}

          />

        </div>

      );

    }



    if (question.type === 'select' && question.options) {

      return (

        <div key={question.id} className="mb-6">

          {renderLabel(label, info)}

          <select

            value={(value as string) || ''}

            onChange={(e) => handleInputChange(question.id, e.target.value)}

            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"

          >

            <option value="">

              {language === 'en' ? 'Select an option' : 'Sélectionner une option'}

            </option>

            {question.options.map((option) => (

              <option key={option.value} value={option.value}>

                {language === 'en' ? option.labelEn : option.labelFr}

              </option>

            ))}

          </select>

        </div>

      );

    }



    return null;

  };



  const renderSection = (section: ChecklistSection) => {

    const isExpanded = expandedSections.has(section.id);

    const sectionTitle = language === 'en' ? section.titleEn : section.titleFr;



    return (

      <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">

        <button

          onClick={() => toggleSection(section.id)}

          className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"

        >

          <span className="font-semibold text-gray-900">{sectionTitle}</span>

          {isExpanded ? (

            <ChevronDown className="w-5 h-5 text-gray-600" />

          ) : (

            <ChevronRight className="w-5 h-5 text-gray-600" />

          )}

        </button>



        {isExpanded && (

          <div className="p-6 bg-white">

            {section.questions.map((question) => renderQuestion(question))}

          </div>

        )}

      </div>

    );

  };



  // --- Reusable Save Button Component ---

  const SaveButton = () => (

    <button

      onClick={handleSave}

      disabled={saving}

      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"

    >

      {saved && <Check className="w-4 h-4" />}

      <span>

        {saving

          ? t('loading', language)

          : saved

          ? t('dashboard.checklist.saved', language)

          : t('dashboard.checklist.save', language)}

      </span>

    </button>

  );

 



  return (

    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">

      <div className="flex items-center justify-between mb-6">

        <h2 className="text-xl font-bold text-gray-900">

          {t('dashboard.checklist.title', language)}

        </h2>

        <SaveButton />

      </div>



      <div className="space-y-4">

        {checklistConfig.map((section) => renderSection(section))}

      </div>



      {/* --- New Button at the bottom --- */}

      <div className="flex justify-end mt-6">

        <SaveButton />

      </div>

      {/* --- End new button --- */}



    </div>

  );

}