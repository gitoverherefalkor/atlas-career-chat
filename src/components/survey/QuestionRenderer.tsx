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
}

// Career happiness entry type (separate question)
interface CareerHappinessEntry {
  title: string;
  happiness: number;
  reason: string;
}

// Company size and culture options
const COMPANY_SIZE_OPTIONS = [
  { value: 'Own Company', label: 'Own Company' },
  { value: 'Micro (1-10)', label: 'Micro (1-10 employees)' },
  { value: 'Small (11-50)', label: 'Small (11-50 employees)' },
  { value: 'Medium (51-200)', label: 'Medium (51-200 employees)' },
  { value: 'Large (201-1000)', label: 'Large (201-1000 employees)' },
  { value: 'Enterprise (1000+)', label: 'Enterprise (1000+ employees)' },
];

const COMPANY_CULTURE_OPTIONS = [
  { value: 'Startup', label: 'Startup', description: 'Fast-paced, minimal structure, high growth potential' },
  { value: 'Corporate', label: 'Corporate', description: 'Established processes, structured hierarchy, stable' },
  { value: 'Boutique', label: 'Boutique', description: 'Specialized firm, niche focus, direct client impact' },
  { value: 'Nonprofit', label: 'Nonprofit', description: 'Mission-driven, collaborative, purpose-focused' },
  { value: 'Government', label: 'Government', description: 'Public sector, formal procedures, regulatory compliance' },
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
        yearsInRole: ''
      };

      const careerHistoryValue: CareerHistoryEntry[] = value || [{ ...emptyEntry }];

      const updateCareerHistory = (index: number, field: keyof CareerHistoryEntry, fieldValue: string | number) => {
        const newHistory = [...careerHistoryValue];
        newHistory[index] = { ...newHistory[index], [field]: fieldValue };
        onChange(newHistory);
      };

      const addCareerRow = () => {
        if (careerHistoryValue.length < 3) {
          onChange([...careerHistoryValue, { ...emptyEntry }]);
        }
      };

      const removeCareerRow = (index: number) => {
        if (careerHistoryValue.length > 1) {
          const newHistory = careerHistoryValue.filter((_, i) => i !== index);
          onChange(newHistory);
        }
      };

      const getRoleLabel = (index: number) => {
        if (index === 0) return 'Role 1 (Most Recent)';
        return `Role ${index + 1}`;
      };

      return (
        <div>
          <div
            className="text-lg font-light mb-2"
            dangerouslySetInnerHTML={formatTextWithEmphasis(question.label)}
          />
          {renderDescription()}

          <div className="space-y-6">
            {careerHistoryValue.map((entry, index) => (
              <div key={index} className="p-5 border-2 rounded-xl bg-white shadow-sm">
                {/* Role header */}
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                  <span className="text-base font-semibold text-atlas-navy">{getRoleLabel(index)}</span>
                  {careerHistoryValue.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCareerRow(index)}
                      className="text-sm text-red-500 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Row 1: Job Title + Company Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                    <Input
                      value={entry.title}
                      onChange={(e) => updateCareerHistory(index, 'title', e.target.value)}
                      placeholder="e.g., Director of Marketing"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <Input
                      value={entry.companyName}
                      onChange={(e) => updateCareerHistory(index, 'companyName', e.target.value)}
                      placeholder="e.g., Acme Legal AI"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Row 2: Company Size + Company Culture */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                    <Select
                      value={entry.companySize || ''}
                      onValueChange={(val) => updateCareerHistory(index, 'companySize', val)}
                    >
                      <SelectTrigger className="w-full">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Culture</label>
                    <Select
                      value={entry.companyCulture || ''}
                      onValueChange={(val) => updateCareerHistory(index, 'companyCulture', val)}
                    >
                      <SelectTrigger className="w-full">
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

                {/* Row 3: Sector + Years in Role */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry / Sector</label>
                    <Input
                      value={entry.sector}
                      onChange={(e) => updateCareerHistory(index, 'sector', e.target.value)}
                      placeholder="e.g., Legal Tech, FinTech, Healthcare"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Years in Role</label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={entry.yearsInRole}
                      onChange={(e) => updateCareerHistory(index, 'yearsInRole', e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="e.g., 3"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            ))}

            {careerHistoryValue.length < 3 && (
              <button
                type="button"
                onClick={addCareerRow}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-atlas-teal hover:text-atlas-teal transition-colors font-medium"
              >
                + Add another role (up to 3)
              </button>
            )}

            <p className="text-xs text-gray-500 mt-2 text-center">
              Add up to 3 of your most recent professional roles, starting with the most recent.
            </p>
          </div>
        </div>
      );

    case 'career_happiness':
      // Career happiness - shows roles from career_history question with happiness slider + optional reason
      const linkedQuestionId = question.config?.linkedQuestionId || '11111111-1111-1111-1111-111111111110';
      const careerHistoryData: CareerHistoryEntry[] = allResponses?.[linkedQuestionId] || [];

      // Filter to only show roles that have a title
      const validCareers = careerHistoryData.filter(c => c.title && c.title.trim() !== '');

      // Initialize happiness values if not set
      const happinessValue: CareerHappinessEntry[] = value || validCareers.map(c => ({
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