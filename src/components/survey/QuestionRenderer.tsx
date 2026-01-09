import React, { useState, useRef, useEffect } from 'react';
import { Question } from '@/hooks/useSurvey';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { GripVertical } from 'lucide-react';

interface QuestionRendererProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  allResponses?: Record<string, any>; // For cross-question access (e.g., career_happiness needs career_history)
}

// Career history entry type - comprehensive (satisfaction is separate question)
interface CareerHistoryEntry {
  title: string;
  companyName: string;
  companySize: string;
  companyCulture: string;
  sector: string;
  yearsInRole: number | '';
  startMonth: string;
  startYear: number | '';
  endMonth: string;
  endYear: number | '';
  isCurrent: boolean;
}

// Career happiness entry type (separate question)
interface CareerHappinessEntry {
  title: string;
  happiness: number;
  reason: string;
}

// Skills & Achievements entry type
interface SkillsAchievementsEntry {
  topSkills: string[];
  certifications: string[];
  achievements: string;
}

// Interests/Hobbies entry type
interface InterestsEntry {
  interests: string[];
}

// Company size and culture options
const COMPANY_SIZE_OPTIONS = [
  { value: 'Own Company', label: 'Own Company' },
  { value: 'Micro (1-10)', label: 'Micro (1-10 employees)' },
  { value: 'Small (11-50)', label: 'Small (11-50 employees)' },
  { value: 'Medium (51-200)', label: 'Medium (51-200 employees)' },
  { value: 'Large (201-1000)', label: 'Large (201-1000 employees)' },
  { value: 'Enterprise (1000-5000)', label: 'Enterprise (1000-5000 employees)' },
  { value: 'Multi National (5000+)', label: 'Multi National (5000+ employees)' },
];

const COMPANY_CULTURE_OPTIONS = [
  { value: 'Startup / Scale-up', label: 'Startup / Scale-up', description: 'High growth, fast-paced, evolving structure' },
  { value: 'Corporate', label: 'Corporate', description: 'Established, structured hierarchy, stable' },
  { value: 'Mid-Market', label: 'Mid-Market', description: 'Balanced growth, professionalized, cross-functional' },
  { value: 'Agency / Consultancy', label: 'Agency / Consultancy', description: 'Client-centric, project-based, high variety' },
  { value: 'Boutique / Niche', label: 'Boutique / Niche', description: 'Specialized firm, small team, direct impact' },
  { value: 'Nonprofit / Social Impact', label: 'Nonprofit / Social Impact', description: 'Mission-driven, purpose-focused, collaborative' },
  { value: 'Public Sector / Gov', label: 'Public Sector / Gov', description: 'Formal procedures, regulatory, public service' },
];

// Responsive Ranking Component
const ResponsiveRanking: React.FC<{
  question: any;
  value: any;
  onChange: (value: any) => void;
  formatTextWithEmphasis: (text: string) => { __html: string };
}> = ({ question, value, onChange, formatTextWithEmphasis }) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const dragCounterRef = useRef(0);
  
  const rankingChoices = question.config?.choices || [];
  
  // Device detection
  useEffect(() => {
    const checkDevice = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      
      setIsMobile(isMobileDevice || isTouchDevice || isSmallScreen);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);
  
  // Initialize with all items if no value exists
  const getCurrentOrder = () => {
    if (value && Array.isArray(value) && value.length === rankingChoices.length) {
      return value;
    }
    return [...rankingChoices];
  };
  
  const currentOrder = getCurrentOrder();
  
  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: string) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
  };
  
  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedItem(null);
    setDraggedOverIndex(null);
    dragCounterRef.current = 0;
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragCounterRef.current++;
    setDraggedOverIndex(index);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setDraggedOverIndex(null);
    }
  };
  
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (!draggedItem) return;
    
    const newOrder = [...currentOrder];
    const draggedIndex = newOrder.indexOf(draggedItem);
    
    if (draggedIndex !== -1) {
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(dropIndex, 0, draggedItem);
      onChange(newOrder);
    }
    
    setDraggedItem(null);
    setDraggedOverIndex(null);
    dragCounterRef.current = 0;
  };
  
  const moveItem = (fromIndex: number, toIndex: number) => {
    const newOrder = [...currentOrder];
    const [movedItem] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedItem);
    onChange(newOrder);
  };
  
  // Numerical ranking handlers
  const handleRankingChange = (item: string, newRank: number) => {
    const newOrder = [...currentOrder];
    const currentIndex = newOrder.indexOf(item);
    
    if (currentIndex !== -1) {
      newOrder.splice(currentIndex, 1);
      newOrder.splice(newRank - 1, 0, item);
      onChange(newOrder);
    }
  };
  
  const getCurrentRank = (item: string) => {
    return currentOrder.indexOf(item) + 1;
  };
  
  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="flex items-center gap-2 text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
        {isMobile ? (
          <span>
            <strong>Use the dropdowns</strong> to select the rank for each item (1 = most important)
          </span>
        ) : (
          <span>
            <strong>Drag and drop</strong> to reorder items by importance (most important at top)
          </span>
        )}
      </div>
      
      {/* Desktop: Drag & Drop */}
      {!isMobile && (
        <div className="space-y-2">
          {currentOrder.map((item, index) => {
            const isDragging = draggedItem === item;
            const isDropTarget = draggedOverIndex === index;
            
            return (
              <div
                key={item}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={`
                  group relative flex items-center p-4 bg-white rounded-lg border-2 cursor-move
                  transition-all duration-200 hover:shadow-md
                  ${isDragging ? 'opacity-50 rotate-1 shadow-lg' : ''}
                  ${isDropTarget ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <div className="flex items-center justify-center w-8 h-8 bg-atlas-navy text-white rounded-full font-bold text-sm mr-4 flex-shrink-0">
                  {index + 1}
                </div>
                
                <div className="flex items-center mr-3 text-gray-400 group-hover:text-gray-600 transition-colors">
                  <GripVertical className="h-5 w-5" />
                </div>
                
                <div className="flex-1">
                  <span 
                    className="text-base font-light leading-relaxed"
                    dangerouslySetInnerHTML={formatTextWithEmphasis(item)}
                  />
                </div>
                
                <div className="flex flex-col gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => index > 0 && moveItem(index, index - 1)}
                    disabled={index === 0}
                    className="w-6 h-6 flex items-center justify-center text-xs bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => index < currentOrder.length - 1 && moveItem(index, index + 1)}
                    disabled={index === currentOrder.length - 1}
                    className="w-6 h-6 flex items-center justify-center text-xs bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    ↓
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Mobile: Dropdown */}
      {isMobile && (
        <div className="space-y-3">
          {rankingChoices.map((item) => {
            const currentRank = getCurrentRank(item);
            
            return (
              <div
                key={item}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white rounded-lg border border-gray-200 space-y-3 sm:space-y-0"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 bg-atlas-navy text-white rounded-full font-bold text-sm flex-shrink-0">
                    {currentRank}
                  </div>
                  <span 
                    className="text-base font-light leading-relaxed"
                    dangerouslySetInnerHTML={formatTextWithEmphasis(item)}
                  />
                </div>
                <div className="flex items-center justify-between sm:justify-end space-x-3">
                  <span className="text-sm text-gray-500 font-medium">Rank:</span>
                  <Select
                    value={currentRank.toString()}
                    onValueChange={(newRank) => handleRankingChange(item, parseInt(newRank))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: rankingChoices.length }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Progress */}
      <div className="mt-4 p-3 bg-green-50 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm text-green-800">
            <strong>Ranking Complete:</strong> All {currentOrder.length} items are ordered by importance
          </span>
        </div>
      </div>
    </div>
  );
};

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  value,
  onChange,
  allResponses,
}) => {
  const [otherValue, setOtherValue] = useState('');
  const [showOther, setShowOther] = useState(false);

  const handleMultipleChoiceChange = (optionValue: string, checked: boolean) => {
    const currentValues = Array.isArray(value) ? value : [];
    const maxSelections = question.max_selections;
    
    if (checked) {
      // Check if we're at the selection limit
      if (maxSelections && currentValues.length >= maxSelections) {
        return; // Don't allow more selections
      }
      onChange([...currentValues, optionValue]);
    } else {
      onChange(currentValues.filter((v: string) => v !== optionValue));
    }
  };

  const handleOtherChange = (otherText: string) => {
    setOtherValue(otherText);
    const currentValues = Array.isArray(value) ? value : [];
    
    if (otherText.trim()) {
      // Add or update the "Other" response
      const filteredValues = currentValues.filter((v: string) => !v.startsWith('Other: '));
      onChange([...filteredValues, `Other: ${otherText.trim()}`]);
    } else {
      // Remove "Other" response if text is empty
      onChange(currentValues.filter((v: string) => !v.startsWith('Other: ')));
    }
  };

  // Function to format text with emphasis and line breaks
  const formatTextWithEmphasis = (text: string) => {
    // Replace **text** with <strong>text</strong> and \n with <br>
    const formattedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\\n/g, '<br>');
    return { __html: formattedText };
  };

  const renderDescription = () => {
    if (!question.config?.description) return null;
    
    return (
      <div 
        className="text-sm text-gray-600 mt-2 mb-4 leading-relaxed"
        dangerouslySetInnerHTML={formatTextWithEmphasis(question.config.description)}
      />
    );
  };

  const getSelectionLimitText = () => {
    const minSelections = question.min_selections;
    const maxSelections = question.max_selections;
    const currentSelections = Array.isArray(value) ? value.length : 0;
    
    if (!minSelections && !maxSelections) return null;
    
    let text = `Selected: ${currentSelections}`;
    
    if (minSelections && maxSelections) {
      text += ` (${minSelections}-${maxSelections} required)`;
    } else if (minSelections) {
      text += ` (minimum ${minSelections})`;
    } else if (maxSelections) {
      text += ` (up to ${maxSelections})`;
    }
    
    return (
      <p className="text-sm text-gray-500 mt-2">
        {text}
      </p>
    );
  };

  const isSelectionLimitReached = () => {
    const maxSelections = question.max_selections;
    const currentSelections = Array.isArray(value) ? value.length : 0;
    return maxSelections && currentSelections >= maxSelections;
  };

  switch (question.type) {
    case 'short_text':
      return (
        <div>
          <div 
            className="text-lg font-light mb-2"
            dangerouslySetInnerHTML={formatTextWithEmphasis(question.label)}
          />
          {renderDescription()}
          {/* Use a textarea for short_text to allow multiline and more space */}
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your response..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-base leading-relaxed resize-y min-h-[120px]"
            rows={5}
          />
        </div>
      );

    case 'long_text':
      return (
        <div>
          <div 
            className="text-lg font-light mb-2"
            dangerouslySetInnerHTML={formatTextWithEmphasis(question.label)}
          />
          {renderDescription()}
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your response..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-base leading-relaxed resize-y min-h-[350px]"
            rows={10}
            maxLength={question.config?.max_length}
          />
          {question.config?.max_length && (
            <p className="text-sm text-gray-500 mt-2">
              {(value || '').length} / {question.config.max_length} characters
            </p>
          )}
        </div>
      );

    case 'number':
      return (
        <div>
          <div 
            className="text-lg font-light mb-2"
            dangerouslySetInnerHTML={formatTextWithEmphasis(question.label)}
          />
          {renderDescription()}
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : '')}
            placeholder="Enter a number..."
            className="w-full"
          />
        </div>
      );

    case 'dropdown':
      return (
        <div>
          <div 
            className="text-lg font-light mb-2"
            dangerouslySetInnerHTML={formatTextWithEmphasis(question.label)}
          />
          {renderDescription()}
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {question.config?.choices?.map((choice) => (
                <SelectItem key={choice} value={choice}>
                  <span dangerouslySetInnerHTML={formatTextWithEmphasis(choice)} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'multiple_choice':
      if (!question.allow_multiple) {
        // Single selection with enhanced interaction
        return (
          <div>
            <div 
              className="text-lg font-light mb-2"
              dangerouslySetInnerHTML={formatTextWithEmphasis(question.label)}
            />
            {renderDescription()}
            <RadioGroup value={value || ''} onValueChange={onChange} className="space-y-2">
              {question.config?.choices?.map((choice) => {
                const isSelected = value === choice;
                return (
                  <div 
                    key={choice} 
                    onClick={() => onChange(choice)}
                    className={`
                      group relative flex items-center p-4 rounded-lg border cursor-pointer
                      transition-all duration-200 hover:shadow-md
                      ${isSelected 
                        ? 'border-atlas-teal bg-atlas-teal/5 shadow-sm' 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <RadioGroupItem 
                      value={choice} 
                      id={`radio-${choice}`}
                      className={`
                        transition-all duration-200 flex-shrink-0
                        ${isSelected ? 'border-atlas-teal' : 'border-gray-300 group-hover:border-gray-400'}
                      `}
                    />
                    <Label 
                      htmlFor={`radio-${choice}`} 
                      className={`
                        text-base font-light leading-relaxed cursor-pointer ml-4 flex-1
                        transition-colors duration-200
                        ${isSelected ? 'text-atlas-navy font-medium' : 'text-gray-700 group-hover:text-gray-900'}
                      `}
                      dangerouslySetInnerHTML={formatTextWithEmphasis(choice)}
                    />
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute right-4 text-atlas-teal">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
              {question.allow_other && (
                <div 
                  onClick={() => onChange('other')}
                  className={`
                    group relative flex items-center p-4 rounded-lg border-2 cursor-pointer
                    transition-all duration-200 hover:shadow-md
                    ${value === 'other' 
                      ? 'border-atlas-teal bg-atlas-teal/5 shadow-sm' 
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <RadioGroupItem 
                    value="other" 
                    id="other"
                    className={`
                      transition-all duration-200 flex-shrink-0
                      ${value === 'other' ? 'border-atlas-teal' : 'border-gray-300 group-hover:border-gray-400'}
                    `}
                  />
                  <Label 
                    htmlFor="other" 
                    className={`
                      text-base font-light leading-relaxed cursor-pointer ml-4 flex-1
                      transition-colors duration-200
                      ${value === 'other' ? 'text-atlas-navy font-medium' : 'text-gray-700 group-hover:text-gray-900'}
                    `}
                  >
                    Other
                  </Label>
                  {value === 'other' && (
                    <div className="absolute right-4 text-atlas-teal">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              )}
            </RadioGroup>
            {question.allow_other && value === 'other' && (
              <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
                <Input
                  value={otherValue}
                  onChange={(e) => {
                    setOtherValue(e.target.value);
                    onChange(`Other: ${e.target.value}`);
                  }}
                  placeholder="Please specify..."
                  className="w-full bg-gray-50 border-0 focus:ring-0 focus:outline-none px-4 py-3 rounded-md mt-2"
                  autoFocus
                />
              </div>
            )}
          </div>
        );
      } else {
        // Multiple selection with enhanced interaction
        const currentValues = Array.isArray(value) ? value : [];
        return (
          <div>
            <div 
              className="text-lg font-light mb-2"
              dangerouslySetInnerHTML={formatTextWithEmphasis(question.label)}
            />
            {renderDescription()}
            <div className="space-y-2">
              {question.config?.choices?.map((choice) => {
                const isChecked = currentValues.includes(choice);
                
                return (
                  <div 
                    key={choice} 
                    onClick={(e) => {
                      e.preventDefault();
                      handleMultipleChoiceChange(choice, !isChecked);
                    }}
                    className={`
                      group relative flex items-center p-4 rounded-lg border cursor-pointer
                      transition-all duration-200
                      ${isChecked 
                        ? 'border-atlas-teal bg-atlas-teal/5 shadow-sm hover:shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 hover:shadow-md'
                      }
                    `}
                  >
                    <Checkbox
                      id={choice}
                      checked={isChecked}
                      onCheckedChange={(checked) => handleMultipleChoiceChange(choice, checked as boolean)}
                      className={`
                        transition-all duration-200 flex-shrink-0
                        ${isChecked ? 'border-atlas-teal data-[state=checked]:bg-atlas-teal' : 'border-gray-300 group-hover:border-gray-400'}
                      `}
                    />
                    <Label 
                      htmlFor={choice} 
                      className={`
                        text-base font-light leading-relaxed cursor-pointer ml-4 flex-1
                        transition-colors duration-200
                        ${isChecked 
                          ? 'text-atlas-navy font-medium' 
                          : 'text-gray-700 group-hover:text-gray-900'
                        }
                      `}
                      dangerouslySetInnerHTML={formatTextWithEmphasis(choice)}
                    />
                    {/* Selection indicator for checkboxes */}
                    {isChecked && (
                      <div className="absolute right-4 text-atlas-teal">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
              {question.allow_other && (
                <div className="space-y-2">
                  <div 
                    onClick={(e) => {
                      e.preventDefault();
                      const hasOtherResponse = currentValues.some((v: string) => v.startsWith('Other: '));
                      if (!showOther && !hasOtherResponse) {
                        // Show the input field and check the checkbox
                        setShowOther(true);
                      } else if (hasOtherResponse) {
                        // Remove the "Other" response
                        handleOtherChange('');
                        setOtherValue('');
                        setShowOther(false);
                      }
                    }}
                    className={`
                      group relative flex items-center p-4 rounded-lg border-2 cursor-pointer
                      transition-all duration-200 hover:shadow-md
                      ${(showOther || currentValues.some((v: string) => v.startsWith('Other: ')))
                        ? 'border-atlas-teal bg-atlas-teal/5 shadow-sm'
                        : (!showOther && !currentValues.some((v: string) => v.startsWith('Other: ')) && isSelectionLimitReached())
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Checkbox
                      id="other-checkbox"
                      checked={showOther || currentValues.some((v: string) => v.startsWith('Other: '))}
                      onCheckedChange={(checked) => {
                        setShowOther(checked as boolean);
                        if (!checked) {
                          handleOtherChange('');
                          setOtherValue('');
                        }
                      }}
                      className={`
                        transition-all duration-200 flex-shrink-0
                        ${(showOther || currentValues.some((v: string) => v.startsWith('Other: '))) 
                          ? 'border-atlas-teal data-[state=checked]:bg-atlas-teal' 
                          : 'border-gray-300 group-hover:border-gray-400'
                        }
                      `}
                    />
                    <Label 
                      htmlFor="other-checkbox" 
                      className={`
                        text-base font-light leading-relaxed cursor-pointer ml-4 flex-1
                        transition-colors duration-200
                        ${(showOther || currentValues.some((v: string) => v.startsWith('Other: ')))
                          ? 'text-atlas-navy font-medium'
                          : 'text-gray-700 group-hover:text-gray-900'
                        }
                      `}
                    >
                      Other
                    </Label>
                  </div>
                  {(showOther || currentValues.some((v: string) => v.startsWith('Other: '))) && (
                    <div className="animate-in slide-in-from-top-2 duration-200 mt-2">
                      <Input
                        value={otherValue}
                        onChange={(e) => handleOtherChange(e.target.value)}
                        placeholder="Please specify..."
                        className="w-full bg-gray-50 border-0 focus:ring-0 focus:outline-none px-4 py-3 rounded-md"
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            {getSelectionLimitText()}
          </div>
        );
      }

    case 'rating':
      const min = question.config?.min || 1;
      const max = question.config?.max || 10;
      const currentValue = value ? [value] : [min];
      
      return (
        <div>
          <div 
            className="text-lg font-light mb-2"
            dangerouslySetInnerHTML={formatTextWithEmphasis(question.label)}
          />
          {renderDescription()}
          <div className="space-y-4">
            <div className="px-4">
              <Slider
                value={currentValue}
                onValueChange={(newValue) => onChange(newValue[0])}
                min={min}
                max={max}
                step={1}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600 px-4">
              <span>{min}</span>
              <span className="font-medium text-lg text-atlas-navy">
                {currentValue[0]}
              </span>
              <span>{max}</span>
            </div>
          </div>
        </div>
      );

    case 'ranking':
      return (
        <div>
          <div 
            className="text-lg font-light mb-2"
            dangerouslySetInnerHTML={formatTextWithEmphasis(question.label)}
          />
          {renderDescription()}
          
          <ResponsiveRanking
            question={question}
            value={value}
            onChange={onChange}
            formatTextWithEmphasis={formatTextWithEmphasis}
          />
        </div>
      );

    case 'career_history':
      // Career history - comprehensive fields (satisfaction is separate question)
      const emptyEntry: CareerHistoryEntry = {
        title: '',
        companyName: '',
        companySize: '',
        companyCulture: '',
        sector: '',
        yearsInRole: '',
        startMonth: '',
        startYear: '',
        endMonth: '',
        endYear: '',
        isCurrent: false
      };

      // Month options
      const MONTHS = [
        { value: 'Jan', label: 'Jan' },
        { value: 'Feb', label: 'Feb' },
        { value: 'Mar', label: 'Mar' },
        { value: 'Apr', label: 'Apr' },
        { value: 'May', label: 'May' },
        { value: 'Jun', label: 'Jun' },
        { value: 'Jul', label: 'Jul' },
        { value: 'Aug', label: 'Aug' },
        { value: 'Sep', label: 'Sep' },
        { value: 'Oct', label: 'Oct' },
        { value: 'Nov', label: 'Nov' },
        { value: 'Dec', label: 'Dec' },
      ];

      // Calculate duration between dates
      const calculateDuration = (entry: CareerHistoryEntry): string => {
        if (!entry.startMonth || !entry.startYear) return '';

        const monthToNum: Record<string, number> = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };

        const startDate = new Date(Number(entry.startYear), monthToNum[entry.startMonth] || 0);
        let endDate: Date;

        if (entry.isCurrent) {
          endDate = new Date();
        } else if (entry.endMonth && entry.endYear) {
          endDate = new Date(Number(entry.endYear), monthToNum[entry.endMonth] || 0);
        } else {
          return '';
        }

        const totalMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                           (endDate.getMonth() - startDate.getMonth());

        if (totalMonths < 0) return '';

        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;

        if (years === 0 && months === 0) return 'Less than a month';
        if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`;
        if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`;
        return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
      };

      // Ensure value is always an array with 5 entries (handle string prefill from AI)
      const ensureFiveEntries = (arr: CareerHistoryEntry[]): CareerHistoryEntry[] => {
        const result = [...arr];
        while (result.length < 5) {
          result.push({ ...emptyEntry });
        }
        return result.slice(0, 5);
      };
      const careerHistoryValue: CareerHistoryEntry[] = Array.isArray(value)
        ? ensureFiveEntries(value)
        : [{ ...emptyEntry }, { ...emptyEntry }, { ...emptyEntry }, { ...emptyEntry }, { ...emptyEntry }];

      // Helper to convert month name to number for sorting
      const monthToNumber = (month: string): number => {
        const months: Record<string, number> = {
          'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
          'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
        };
        return months[month] || 0;
      };

      // Auto-sort by recency: current roles first, then by end date (desc), then start date (desc)
      const sortByRecency = (entries: CareerHistoryEntry[]): CareerHistoryEntry[] => {
        return [...entries].sort((a, b) => {
          // Empty entries go to the end
          const aEmpty = !a.title;
          const bEmpty = !b.title;
          if (aEmpty && !bEmpty) return 1;
          if (!aEmpty && bEmpty) return -1;
          if (aEmpty && bEmpty) return 0;

          // Current roles come first
          if (a.isCurrent && !b.isCurrent) return -1;
          if (!a.isCurrent && b.isCurrent) return 1;

          // Sort by end date (most recent first)
          const aEndYear = Number(a.endYear || a.startYear || 0);
          const bEndYear = Number(b.endYear || b.startYear || 0);
          if (aEndYear !== bEndYear) return bEndYear - aEndYear;

          const aEndMonth = monthToNumber(a.endMonth || a.startMonth || '');
          const bEndMonth = monthToNumber(b.endMonth || b.startMonth || '');
          if (aEndMonth !== bEndMonth) return bEndMonth - aEndMonth;

          // Then by start date
          const aStartYear = Number(a.startYear || 0);
          const bStartYear = Number(b.startYear || 0);
          if (aStartYear !== bStartYear) return bStartYear - aStartYear;

          return monthToNumber(b.startMonth || '') - monthToNumber(a.startMonth || '');
        });
      };

      const updateCareerHistory = (index: number, field: keyof CareerHistoryEntry, fieldValue: string | number | boolean) => {
        const newHistory = [...careerHistoryValue];
        newHistory[index] = { ...newHistory[index], [field]: fieldValue };

        // If marking as current, clear end month and year
        if (field === 'isCurrent' && fieldValue === true) {
          newHistory[index].endMonth = '';
          newHistory[index].endYear = '';
        }

        onChange(newHistory);
      };

      const addCareerRow = () => {
        if (careerHistoryValue.length < 5) {
          onChange([...careerHistoryValue, { ...emptyEntry }]);
        }
      };

      const removeCareerRow = (index: number) => {
        // Clear the entry and collapse gaps (move remaining entries up)
        const newHistory = [...careerHistoryValue];
        newHistory.splice(index, 1);
        // Always keep 5 slots
        while (newHistory.length < 5) {
          newHistory.push({ ...emptyEntry });
        }
        onChange(newHistory);
      };

      const getRoleLabel = (index: number, entry: CareerHistoryEntry) => {
        if (entry.isCurrent) return `Role ${index + 1} (Current)`;
        if (index === 0) return 'Role 1 (Most Recent)';
        return `Role ${index + 1}`;
      };

      // Generate year options (current year back to 50 years ago)
      const currentYear = new Date().getFullYear();
      const yearOptions = Array.from({ length: 51 }, (_, i) => currentYear - i);

      // Check if entry is active (has at least a title)
      const isActiveEntry = (entry: CareerHistoryEntry): boolean => {
        return !!(entry.title && entry.title.trim());
      };

      return (
        <div>
          <div
            className="text-lg font-light mb-2"
            dangerouslySetInnerHTML={formatTextWithEmphasis(question.label)}
          />
          {renderDescription()}

          <div className="space-y-6">
            {careerHistoryValue.map((entry, index) => {
              const isActive = isActiveEntry(entry);

              return (
                <div
                  key={index}
                  className={`p-5 border-2 rounded-xl shadow-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-white border-atlas-teal/30'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  {/* Role header */}
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className={`text-base font-semibold ${isActive ? 'text-atlas-navy' : 'text-gray-400'}`}>
                        {getRoleLabel(index, entry)}
                      </span>
                      {isActive && (
                        <div className="text-green-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCareerRow(index)}
                      className="text-sm text-gray-400 hover:text-red-500 font-medium transition-colors"
                    >
                      Clear
                    </button>
                  </div>

                {/* Row 1: Job Title + Company Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isActive ? 'text-gray-700' : 'text-gray-400'}`}>Job Title</label>
                    <Input
                      value={entry.title}
                      onChange={(e) => updateCareerHistory(index, 'title', e.target.value)}
                      placeholder="e.g., Director of Marketing"
                      className={`w-full ${!isActive ? 'placeholder:text-gray-300' : ''}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isActive ? 'text-gray-700' : 'text-gray-400'}`}>Company Name</label>
                    <Input
                      value={entry.companyName}
                      onChange={(e) => updateCareerHistory(index, 'companyName', e.target.value)}
                      placeholder="e.g., Acme Legal AI"
                      className={`w-full ${!isActive ? 'placeholder:text-gray-300' : ''}`}
                    />
                  </div>
                </div>

                {/* Row 2: Company Size + Company Culture */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isActive ? 'text-gray-700' : 'text-gray-400'}`}>
                      Company Size <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={entry.companySize || ''}
                      onValueChange={(val) => updateCareerHistory(index, 'companySize', val)}
                      required
                    >
                      <SelectTrigger className={`w-full ${!isActive ? 'text-gray-400' : ''}`}>
                        <SelectValue placeholder="Select size..." />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_SIZE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isActive ? 'text-gray-700' : 'text-gray-400'}`}>
                      Company Culture <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={entry.companyCulture || ''}
                      onValueChange={(val) => updateCareerHistory(index, 'companyCulture', val)}
                      required
                    >
                      <SelectTrigger className={`w-full ${!isActive ? 'text-gray-400' : ''}`}>
                        <SelectValue placeholder="Select culture..." />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_CULTURE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex flex-col">
                              <span>{opt.label}</span>
                              <span className="text-xs text-gray-500">{opt.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 3: Sector */}
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-1 ${isActive ? 'text-gray-700' : 'text-gray-400'}`}>Industry / Sector</label>
                  <Input
                    value={entry.sector}
                    onChange={(e) => updateCareerHistory(index, 'sector', e.target.value)}
                    placeholder="e.g., Legal Tech, FinTech, Healthcare"
                    className={`w-full ${!isActive ? 'placeholder:text-gray-300' : ''}`}
                  />
                </div>

                {/* Row 4: Start (Month + Year) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isActive ? 'text-gray-700' : 'text-gray-400'}`}>Start</label>
                    <div className="flex gap-2">
                      <Select
                        value={entry.startMonth || ''}
                        onValueChange={(val) => updateCareerHistory(index, 'startMonth', val)}
                      >
                        <SelectTrigger className={`w-24 ${!isActive ? 'text-gray-400' : ''}`}>
                          <SelectValue placeholder="Mon" />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={entry.startYear?.toString() || ''}
                        onValueChange={(val) => updateCareerHistory(index, 'startYear', val ? parseInt(val) : '')}
                      >
                        <SelectTrigger className={`flex-1 ${!isActive ? 'text-gray-400' : ''}`}>
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {yearOptions.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isActive ? 'text-gray-700' : 'text-gray-400'}`}>End</label>
                    <div className="flex gap-2">
                      <Select
                        value={entry.endMonth || ''}
                        onValueChange={(val) => updateCareerHistory(index, 'endMonth', val)}
                        disabled={entry.isCurrent}
                      >
                        <SelectTrigger className={`w-24 ${entry.isCurrent ? 'opacity-50' : ''} ${!isActive ? 'text-gray-400' : ''}`}>
                          <SelectValue placeholder={entry.isCurrent ? 'Present' : 'Mon'} />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={entry.endYear?.toString() || ''}
                        onValueChange={(val) => updateCareerHistory(index, 'endYear', val ? parseInt(val) : '')}
                        disabled={entry.isCurrent}
                      >
                        <SelectTrigger className={`flex-1 ${entry.isCurrent ? 'opacity-50' : ''} ${!isActive ? 'text-gray-400' : ''}`}>
                          <SelectValue placeholder={entry.isCurrent ? '' : 'Year'} />
                        </SelectTrigger>
                        <SelectContent>
                          {yearOptions.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Row 5: Current role checkbox + Duration */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`current-role-${index}`}
                      checked={entry.isCurrent || false}
                      onCheckedChange={(checked) => updateCareerHistory(index, 'isCurrent', checked as boolean)}
                      className="h-5 w-5"
                    />
                    <Label
                      htmlFor={`current-role-${index}`}
                      className={`text-sm font-medium cursor-pointer ${isActive ? 'text-gray-700' : 'text-gray-400'}`}
                    >
                      I currently work here
                    </Label>
                  </div>
                  {calculateDuration(entry) && (
                    <span className={`text-sm italic ${isActive ? 'text-gray-500' : 'text-gray-400'}`}>
                      {calculateDuration(entry)}
                    </span>
                  )}
                </div>
              </div>
              );
            })}

            <p className="text-xs text-gray-500 mt-2 text-center">
              Fill in up to 5 of your most recent or parallel professional roles. Click "Clear" to remove roles you don't want included.
            </p>
          </div>
        </div>
      );

    case 'career_happiness':
      // Career happiness - shows roles from career_history question with happiness slider + optional reason
      const linkedQuestionId = question.config?.linkedQuestionId || '11111111-1111-1111-1111-111111111110';
      // Ensure careerHistoryData is always an array
      const rawCareerData = allResponses?.[linkedQuestionId];
      const careerHistoryData: CareerHistoryEntry[] = Array.isArray(rawCareerData) ? rawCareerData : [];

      // Filter to only show roles that have a title
      const validCareers = careerHistoryData.filter(c => c.title && c.title.trim() !== '');

      // Initialize happiness values if not set (ensure array)
      const happinessValue: CareerHappinessEntry[] = Array.isArray(value) ? value : validCareers.map(c => ({
        title: c.title,
        happiness: 5,
        reason: ''
      }));

      // Sync happiness entries with career history (in case careers were added/removed)
      const syncedHappiness: CareerHappinessEntry[] = validCareers.map(career => {
        const existing = happinessValue.find(h => h.title === career.title);
        return existing || { title: career.title, happiness: 5, reason: '' };
      });

      const updateHappiness = (index: number, field: 'happiness' | 'reason', fieldValue: number | string) => {
        const newHappiness = [...syncedHappiness];
        newHappiness[index] = { ...newHappiness[index], [field]: fieldValue };
        onChange(newHappiness);
      };

      if (validCareers.length === 0) {
        return (
          <div>
            <div
              className="text-lg font-light mb-2"
              dangerouslySetInnerHTML={formatTextWithEmphasis(question.label)}
            />
            {renderDescription()}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
              Please fill in your career history in the previous question first.
            </div>
          </div>
        );
      }

      return (
        <div>
          <div
            className="text-lg font-light mb-2"
            dangerouslySetInnerHTML={formatTextWithEmphasis(question.label)}
          />
          {renderDescription()}

          <div className="space-y-6">
            {syncedHappiness.map((entry, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gray-50">
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    {index === 0 ? 'Role 1 (most recent): ' : `Role ${index + 1}: `}
                  </span>
                  <span className="text-sm text-atlas-navy font-semibold">{entry.title}</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-gray-500">Happiness (1-10)</label>
                      <span className="text-lg font-semibold text-atlas-navy">{entry.happiness}</span>
                    </div>
                    <Slider
                      value={[entry.happiness]}
                      onValueChange={(newValue) => updateHappiness(index, 'happiness', newValue[0])}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>1 (unhappy)</span>
                      <span>10 (very happy)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Why this score? (optional)
                    </label>
                    <Input
                      value={entry.reason}
                      onChange={(e) => updateHappiness(index, 'reason', e.target.value)}
                      placeholder="e.g., Great autonomy, too many direct reports, unclear expectations..."
                      className="w-full text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'skills_achievements':
      // Skills, certifications, and achievements - extracted from LinkedIn/resume
      const emptySkillsAchievements: SkillsAchievementsEntry = {
        topSkills: ['', '', ''],
        certifications: ['', '', ''],
        achievements: ''
      };

      // Parse value - could be object or needs initialization
      const skillsValue: SkillsAchievementsEntry = value && typeof value === 'object'
        ? {
            topSkills: Array.isArray(value.topSkills) ? [...value.topSkills, '', '', ''].slice(0, 3) : ['', '', ''],
            certifications: Array.isArray(value.certifications) ? [...value.certifications, '', '', ''].slice(0, 3) : ['', '', ''],
            achievements: value.achievements || ''
          }
        : { ...emptySkillsAchievements };

      const updateSkillsField = (field: 'topSkills' | 'certifications', index: number, newValue: string) => {
        const updated = { ...skillsValue };
        updated[field] = [...updated[field]];
        updated[field][index] = newValue;
        onChange(updated);
      };

      const updateAchievements = (newValue: string) => {
        onChange({ ...skillsValue, achievements: newValue });
      };

      return (
        <div>
          <div
            className="text-lg font-light mb-2"
            dangerouslySetInnerHTML={formatTextWithEmphasis(question.label)}
          />
          {renderDescription()}

          <div className="space-y-8">
            {/* Top Skills & Certifications Section */}
            <div className="p-5 border-2 rounded-xl bg-white shadow-sm">
              <h3 className="text-base font-semibold text-atlas-navy mb-4">Top Skills & Certifications</h3>

              {/* Top Skills - 3 fixed fields */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Your 3 Top Skills</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[0, 1, 2].map((index) => (
                    <Input
                      key={`skill-${index}`}
                      value={skillsValue.topSkills[index] || ''}
                      onChange={(e) => updateSkillsField('topSkills', index, e.target.value)}
                      placeholder={index === 0 ? 'e.g., Strategic Planning' : index === 1 ? 'e.g., Stakeholder Management' : 'e.g., Budget Administration'}
                      className="w-full"
                    />
                  ))}
                </div>
              </div>

              {/* Certifications - 3 fixed fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Certifications (optional)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[0, 1, 2].map((index) => (
                    <Input
                      key={`cert-${index}`}
                      value={skillsValue.certifications[index] || ''}
                      onChange={(e) => updateSkillsField('certifications', index, e.target.value)}
                      placeholder={index === 0 ? 'e.g., Six Sigma Green Belt' : index === 1 ? 'e.g., Salesforce Certified' : ''}
                      className="w-full"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Achievements Section */}
            <div className="p-5 border-2 rounded-xl bg-white shadow-sm">
              <h3 className="text-base font-semibold text-atlas-navy mb-2">Achievements</h3>
              <p className="text-sm text-gray-600 mb-4">
                Highlight key wins like revenue growth, cost savings, or successful team expansions. Include the company and year.
              </p>
              <textarea
                value={skillsValue.achievements}
                onChange={(e) => updateAchievements(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-base leading-relaxed resize-y min-h-[200px]"
                rows={8}
              />
            </div>
          </div>
        </div>
      );

    case 'interests_hobbies':
      // Interests/Hobbies - 3 separate input fields with 50 character max
      const emptyInterests: InterestsEntry = {
        interests: ['', '', '']
      };

      // Parse value - could be array, object, or string (legacy)
      let interestsValue: InterestsEntry;
      if (Array.isArray(value)) {
        interestsValue = { interests: [...value, '', '', ''].slice(0, 3) };
      } else if (value && typeof value === 'object' && value.interests) {
        interestsValue = { interests: [...value.interests, '', '', ''].slice(0, 3) };
      } else if (typeof value === 'string' && value) {
        // Legacy: convert comma-separated string to array
        const parsed = value.split(',').map(s => s.trim()).filter(s => s);
        interestsValue = { interests: [...parsed, '', '', ''].slice(0, 3) };
      } else {
        interestsValue = { ...emptyInterests };
      }

      const updateInterest = (index: number, newValue: string) => {
        const updated = [...interestsValue.interests];
        updated[index] = newValue.slice(0, 50); // Enforce 50 char limit
        onChange({ interests: updated });
      };

      return (
        <div>
          <div
            className="text-lg font-light mb-2"
            dangerouslySetInnerHTML={formatTextWithEmphasis(question.label)}
          />
          {renderDescription()}

          <div className="space-y-3">
            {[0, 1, 2].map((index) => (
              <div key={`interest-${index}`}>
                <Input
                  value={interestsValue.interests[index] || ''}
                  onChange={(e) => updateInterest(index, e.target.value)}
                  placeholder={index === 0 ? 'e.g., Gardening' : index === 1 ? 'e.g., Creative writing' : 'e.g., Lego'}
                  maxLength={50}
                  className="w-full"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {(interestsValue.interests[index] || '').length}/50
                </p>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return (
        <div>
          <div
            className="text-lg font-light mb-2"
            dangerouslySetInnerHTML={formatTextWithEmphasis(question.label)}
          />
          {renderDescription()}
          <p className="text-red-500">Unsupported question type: {question.type}</p>
        </div>
      );
  }
};